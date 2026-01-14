import pandas as pd, numpy as np, numpy.testing as npt, itertools as it, collections as c
from app.plspm.util import TopoSort
from app.plspm.mode import Mode
from app.plspm.scale import Scale
from app.plspm import util


class Structure:
    """
    Class xây dựng cấu trúc đường dẫn giữa các latent variable (constructs).
    - Sử dụng để tạo ma trận đường dẫn cho mô hình PLS-PM.
    - Mỗi đường dẫn là một mối quan hệ nhân quả giữa các latent variable.
    """
    def __init__(self, path: pd.DataFrame = None):
        # Khởi tạo đối tượng Structure với ma trận đường dẫn (nếu có)
        # Khởi tạo với ma trận đường dẫn (nếu có), dùng TopoSort để quản lý thứ tự các node
        self.__toposort = TopoSort()
        if path is not None:
            # Chuyển ma trận đường dẫn thành danh sách các cặp (source, target)
            paths = [(path.columns[y], path.index[x]) for x, y in zip(*np.where(path.values == 1))]
            for my_path in paths:
                self.add_path([my_path[0]], [my_path[1]])

    def add_path(self, source: list, target: list):
        """
        Thêm một hoặc nhiều đường dẫn giữa các biến tiềm ẩn.
        - source: danh sách biến tiềm ẩn nguồn
        - target: danh sách biến tiềm ẩn đích
        """
        if len(source) != 1 and len(target) != 1:
            raise ValueError("Nguồn hoặc đích phải là danh sách chứa đúng một phần tử")
        if len(source) == 0 or len(target) == 0:
            raise ValueError("Cả nguồn và đích phải chứa ít nhất một phần tử")
        for element in it.product(source, target):
            self.__toposort.append(element[0], element[1])

    def path(self):
        # Trả về ma trận đường dẫn giữa các biến tiềm ẩn
        """
        Trả về ma trận đường dẫn (DataFrame) giữa các biến tiềm ẩn.
        - Dùng để truyền vào Config khi khởi tạo mô hình.
        """
        index = self.__toposort.order() # Lấy thứ tự topo của các biến
        path = pd.DataFrame(np.zeros((len(index), len(index)), int), columns=index, index=index)
        for source, target in self.__toposort.elements():
            path.at[target, source] = 1
        return path

class MV:
    """
    Class đại diện cho một biến quan sát (manifest variable) trong mô hình.
    - Mỗi biến có tên và kiểu đo lường (scale).
    """
    def __init__(self, name: str, scale: Scale = None):
        # Khởi tạo với tên biến và kiểu đo lường 
        self.__scale = scale
        self.__name = name

    def name(self):
        # Trả về tên của biến quan sát
        """
        Trả về tên của biến quan sát (dùng để map với cột dữ liệu).
        """
        return self.__name

    def scale(self):
        # Trả về kiểu đo lường của biến quan sát
        """
        Trả về kiểu đo lường của biến quan sát 
        """
        return self.__scale


class Config:
    """
    Class cấu hình mô hình PLS-PM:
    - Quản lý các latent variable, manifest variable, chế độ đo lường, chuẩn hóa dữ liệu, v.v.
    - Dùng để truyền vào Plspm khi khởi tạo mô hình.
    """
    def __init__(self, path: pd.DataFrame, scaled: bool = True, default_scale: Scale = None):
        # Khởi tạo cấu hình với ma trận đường dẫn, chế độ chuẩn hóa, kiểu đo lường mặc định
        # Khởi tạo với ma trận đường dẫn, chế độ chuẩn hóa, kiểu đo lường mặc định
        self.__modes = {}       # Lưu chế độ đo lường cho từng latent variable
        self.__mvs = {}         # Lưu danh sách manifest variable cho từng latent variable
        self.__hoc = {}         # Lưu cấu trúc higher-order construct nếu có
        self.__dummies = {}     # Lưu các ma trận giả (dummy) cho MV định tính
        self.__mv_scales = {}   # Kiểu đo lường của từng MV
        self.__scaled = scaled  # True nếu dữ liệu chuẩn hóa
        self.__metric = True    # True nếu dữ liệu metric
        self.__default_scale = default_scale    # Kiểu đo mặc định
        self.__missing = False  # True nếu dữ liệu có missing value
        if not isinstance(path, pd.DataFrame):
            raise TypeError("Đối số path phải là một Pandas DataFrame")
        path_shape = path.shape
        if path_shape[0] != path_shape[1]:
            raise ValueError("Ma trận đường dẫn phải là ma trận vuông")
        try:
            npt.assert_array_equal(path, np.tril(path))
        except:
            raise ValueError("Ma trận đường dẫn phải là lower triangular (tam giác dưới)")
        if not path.isin([0, 1]).all(axis=None):
            raise ValueError("Các phần tử trong ma trận đường dẫn chỉ có thể là 0 hoặc 1")
        try:
            npt.assert_array_equal(path.columns.values, path.index.values)
        except:
            raise ValueError("Tên hàng và cột của ma trận đường dẫn phải giống nhau")
        self.__path = path

    def clone(self):
        # Tạo bản sao cấu hình hiện tại
        my_clone = Config(self.__path, self.__scaled, self.__default_scale)
        my_clone.__modes = self.__modes.copy()
        my_clone.__mvs = self.__mvs.copy()
        my_clone.__hoc = self.__hoc.copy()
        my_clone.__dummies = self.__dummies.copy()
        my_clone.__mv_scales = self.__mv_scales.copy()
        my_clone.__metric = self.__metric
        my_clone.__missing = self.__missing
        return my_clone

    def path(self):
        # Trả về ma trận đường dẫn đã khởi tạo
        return self.__path

    def odm(self, path: pd.DataFrame):
        # Trả về outer design matrix: manifest variable thuộc latent variable nào
        mvs = { key: self.__mvs[key] for key in list(path) }
        return util.list_to_dummy(mvs)

    def mv_index(self, lv, mv):
        # Trả về vị trí của manifest variable trong danh sách của latent variable
        return self.__mvs[lv].index(mv)

    def mvs(self, lv):
        # Trả về danh sách manifest variable thuộc latent variable
        return self.__mvs[lv]

    def hoc(self):
        # Trả về dict các higher order construct và các latent variable con
        return self.__hoc

    def mode(self, lv: str):
        # Trả về chế độ đo lường (mode) của latent variable
        return self.__modes[lv]

    def metric(self):
        # Trả về True nếu dùng dữ liệu metric, False nếu nonmetric
        return self.__metric

    def scaled(self):
        # Trả về True nếu dữ liệu được chuẩn hóa
        return self.__scaled

    def scale(self, mv: str):
        # Trả về kiểu đo lường của manifest variable
        return self.__mv_scales[mv]

    def dummies(self, mv: str):
        # Trả về dummy matrix cho biến ordinal/nominal
        return self.__dummies[mv]

    def add_lv(self, lv_name: str, mode: Mode, *mvs: MV):
        """
        Thêm một biến tiềm ẩn (latent variable) và các biến quan sát liên kết vào mô hình.

        Tham số:
            lv_name: Tên biến tiềm ẩn cần thêm. Phải trùng với tên trong ma trận đường dẫn (Path matrix).
            mode: Chế độ đo lường của biến tiềm ẩn (phản xạ - mode A hoặc tạo thành - mode B).
            *mvs: Danh sách các biến quan sát (kiểu MV) tạo nên biến tiềm ẩn này.
        """
        assert mode in Mode
        hoc_lvs = [item for lvs in self.__hoc.values() for item in lvs]
        if lv_name not in self.__path and lv_name not in hoc_lvs:
            raise ValueError("Biến tiềm ẩn " + lv_name + "không có trong ma trận đường dẫn hoặc cấu trúc HOC")
        self.__modes[lv_name] = mode
        self.__mvs[lv_name] = []
        for mv in mvs:
            if mv.name() in self.__mv_scales:
                raise ValueError("Bạn chỉ được định nghĩa một lần cho mỗi cột dữ liệu. Với HOC, dùng `add_higher_order(...)`")
            if mv.name() in list(self.__path):
                raise ValueError("Tên MV không được trùng với tên LV")
            self.__mvs[lv_name].append(mv.name())
            scale = self.__default_scale if mv.scale() is None else mv.scale()
            self.__mv_scales[mv.name()] = scale
            if scale is not None:
                self.__metric = False

    def remove_lv(self, lv_name:str):
        # Xóa biến tiềm ẩn và các biến quan sát khỏi mô hình
        """
        Xóa một biến tiềm ẩn và các biến quan sát liên kết khỏi mô hình.

        Tham số:
            lv_name: Tên biến tiềm ẩn cần xóa.
        """
        self.__mvs.pop(lv_name)
        self.__modes.pop(lv_name)
        
    def add_higher_order(self, hoc_name: str, mode: Mode, lvs: list):
        # Thêm biến bậc cao (higher order construct) vào mô hình
        """
        Thêm một biến bậc cao (higher order construct) vào mô hình.

        Tham số:
            hoc_name: Tên biến bậc cao cần thêm. Phải trùng với tên trong ma trận đường dẫn.
            mode: Chế độ đo lường (mode A: dùng tương quan, mode B: dùng hồi quy) giữa biến bậc cao và các biến con.
            lvs: Danh sách các biến tiềm ẩn con tạo thành biến bậc cao này.
        """
        # TODO: Warn if centroid scheme is used with HOC.
        assert mode in Mode
        if hoc_name not in self.__path:
            raise ValueError("Ma trận đường dẫn không chứa higher order construct " + hoc_name)
        self.__modes[hoc_name] = mode
        self.__hoc[hoc_name] = lvs

    def add_lv_with_columns_named(self, lv_name: str, mode: Mode, data: pd.DataFrame, col_name_starts_with: str,
                                  default_scale: Scale = None):
        # Thêm biến tiềm ẩn với các biến quan sát có tên bắt đầu bằng tiền tố (prefix)
        """
        Thêm một biến tiềm ẩn và các biến quan sát liên kết vào mô hình, khi các biến quan sát có tên bắt đầu bằng cùng một tiền tố.

        Tham số:
            lv_name: Tên biến tiềm ẩn cần thêm. Phải trùng với tên trong ma trận đường dẫn.
            mode: Chế độ đo lường của biến tiềm ẩn (mode A hoặc mode B).
            data: Bộ dữ liệu đầu vào.
            col_name_starts_with: Tiền tố của tên các biến quan sát trong bộ dữ liệu (ví dụ: "var" cho các cột var1, var2, var3).
            default_scale: Kiểu đo lường mặc định cho các biến quan sát nếu là dữ liệu định tính.
        """
        names = filter(lambda x: x.startswith(col_name_starts_with), list(data))
        mvs = list(map(lambda mv: MV(mv, default_scale), names))
        if len(mvs) == 0:
            raise ValueError("Không tìm thấy cột nào trong dữ liệu bắt đầu bằng " + col_name_starts_with)
        self.add_lv(lv_name, mode, *mvs)

    def filter(self, data: pd.DataFrame) -> pd.DataFrame:
        # Lọc dữ liệu: chỉ giữ lại các cột biến quan sát đã cấu hình, loại bỏ các dòng thiếu toàn bộ biến quan sát của một biến tiềm ẩn
        """
        Hàm lọc dữ liệu: chỉ giữ lại các cột biến quan sát đã cấu hình, loại bỏ các dòng mà tất cả biến quan sát của một biến tiềm ẩn đều bị thiếu.

        Tham số:
            data: Bộ dữ liệu đầu vào cần lọc.

        Trả về:
            Bộ dữ liệu đã loại bỏ các cột không cần thiết và các dòng thiếu toàn bộ biến quan sát của một biến tiềm ẩn.

        Ngoại lệ:
            ValueError: Nếu bộ dữ liệu thiếu cột hoặc có giá trị không phải số.
        """
        hoc_lvs = [item for lvs in self.__hoc.values() for item in lvs]
        path_lvs = filter(lambda i: i not in self.__hoc.keys(), list(self.path()) + hoc_lvs)
        
        if set(self.__mvs.keys()) != set(path_lvs):
            raise ValueError(
                "Ma trận đường dẫn không khớp với các biến tiềm ẩn bạn đã thêm." +
                " Path: " + ", ".join(path_lvs) + " LVs: " + ", ".join(set(self.__mvs.keys())))
        
        if not set(self.__mv_scales.keys()).issubset(set(data)):
            raise ValueError(
                "Các biến quan sát đã cấu hình không có trong dữ liệu: " + ", ".join(
                    set(self.__mv_scales.keys()).difference(set(data))))
        data = data[list(self.__mv_scales.keys())]
        
        if False in data.apply(lambda x: np.issubdtype(x.dtype, np.number)).values:
            raise ValueError(
                "Dữ liệu chỉ được chứa giá trị số. Vui lòng chuyển đổi dữ liệu định tính sang số.")
        self.__missing = data.isnull().values.any()
        
        # Nếu tất cả MV của LV đều NaN => đánh dấu xóa
        if self.__missing:
            mv_grouped_by_lv = {}
            rows_to_delete = set()
            for i, lv in enumerate(list(self.path())):
                mvs = self.mvs(lv)
                mv_grouped_by_lv[lv] = data.filter(mvs).values.astype(np.float64)
                for j in range(len(data.index)):
                    if np.count_nonzero(~np.isnan(mv_grouped_by_lv[lv][j, :])) == 0:
                        rows_to_delete.add(j)
            data = data.drop(data.index[list(rows_to_delete)])
        return data

    def treat(self, data: pd.DataFrame) -> pd.DataFrame:
        # Xử lý dữ liệu: chuẩn hóa, chuyển đổi, tạo ma trận giả cho biến thứ tự/định danh
        """
        Hàm xử lý dữ liệu: chuẩn hóa, chuyển đổi, tạo ma trận giả cho biến thứ tự/định danh (ordinal/nominal) nếu cần.

        Tham số:
            data: Bộ dữ liệu đầu vào cần xử lý.

        Trả về:
            Bộ dữ liệu đã được xử lý (chuẩn hóa, chuyển đổi, tạo dummy).

        Ngoại lệ:
            TypeError: Nếu bạn chỉ định kiểu đo lường cho một số biến quan sát mà không chỉ định cho tất cả, hoặc không có kiểu đo lường mặc định.
        """
        if self.__metric:
            metric_data = util.impute(data) if self.__missing else data
            if self.__scaled:
                scale_values = metric_data.stack().std() * np.sqrt((metric_data.shape[0] - 1) / metric_data.shape[0])
                return util.treat(metric_data, scale_values=scale_values)
            else:
                return util.treat(metric_data, scale=True)
        else:
            if None in self.__mv_scales.values():
                raise TypeError("Nếu bạn chỉ định kiểu đo lường cho bất kỳ biến quan sát (MV) nào, bạn phải chỉ định kiểu đo lường cho tất cả các biến quan sát hoặc phải cung cấp một kiểu đo lường mặc định.")
            if set(self.__mv_scales.values()) == {Scale.RAW}:
                self.__scaled = False
            if set(self.__mv_scales.values()) == {Scale.RAW, Scale.NUM}:
                self.__scaled = True
                self.__mv_scales = dict.fromkeys(self.__mv_scales, Scale.NUM)
            data = util.treat(data) / np.sqrt((data.shape[0] - 1) / data.shape[0])
            for mv in self.__mv_scales:
                if self.__mv_scales[mv] in [Scale.ORD, Scale.NOM]:
                    data.loc[:, mv] = util.rank(data.loc[:, mv])
                    self.__dummies[mv] = util.dummy(data.loc[:, mv]).values
            return data

    # def treat(self, data: pd.DataFrame) -> pd.DataFrame:
    #     # Xử lý dữ liệu: chuẩn hóa, chuyển đổi, tạo ma trận giả cho biến thứ tự/định danh
    #     print("=== START treat ===")
    #     print("Original data shape:", data.shape)
    #     print("Columns:", data.columns.tolist())

    #     if self.__metric:
    #         print("Metric data processing")
    #         metric_data = util.impute(data) if self.__missing else data
    #         print("After impute (if any):")
    #         print(metric_data.head())

    #         if self.__scaled:
    #             scale_values = metric_data.stack().std() * np.sqrt((metric_data.shape[0] - 1) / metric_data.shape[0])
    #             print("Scale values calculated:", scale_values)
    #             treated = util.treat(metric_data, scale_values=scale_values)
    #             print("Treated metric data (scaled):")
    #             print(treated.head())
    #             return treated
    #         else:
    #             treated = util.treat(metric_data, scale=True)
    #             print("Treated metric data (not scaled):")
    #             print(treated.head())
    #             return treated
    #     else:
    #         print("Non-metric data processing")
    #         if None in self.__mv_scales.values():
    #             raise TypeError("If you supply a scale for any MV, you must either supply a scale for all of them or specify a default scale.")

    #         print("MV scales:", self.__mv_scales)
    #         if set(self.__mv_scales.values()) == {Scale.RAW}:
    #             self.__scaled = False
    #         if set(self.__mv_scales.values()) == {Scale.RAW, Scale.NUM}:
    #             self.__scaled = True
    #             self.__mv_scales = dict.fromkeys(self.__mv_scales, Scale.NUM)

    #         data = util.treat(data) / np.sqrt((data.shape[0] - 1) / data.shape[0])
    #         print("After treat and scaling:")
    #         print(data.head())

    #         for mv in self.__mv_scales:
    #             if self.__mv_scales[mv] in [Scale.ORD, Scale.NOM]:
    #                 print(f"Processing ordinal/nominal variable: {mv}")
    #                 data.loc[:, mv] = util.rank(data.loc[:, mv])
    #                 self.__dummies[mv] = util.dummy(data.loc[:, mv]).values
    #                 print(f"Dummies for {mv} created, shape:", self.__dummies[mv].shape)

    #         print("=== END treat ===")
    #         return data

