import pandas as pd, math, numpy as np, collections as c


def treat(data: pd.DataFrame, center: bool = True, scale: bool = True, scale_values=None) -> pd.DataFrame:
    """
    Hàm xử lý dữ liệu dạng Pandas DataFrame: chuẩn hóa, chuyển đổi, scale.

    Tham số:
        data: Dữ liệu cần xử lý
        center: Có trừ đi giá trị trung bình không
        scale: Có chia cho độ lệch chuẩn không
        scale_values: Giá trị scale cụ thể nếu có

    Trả về:
        DataFrame đã xử lý
    """
    if center:
        data = data.subtract(data.mean())
    if scale:
        if scale_values:
            data = data.divide(scale_values)
        else:
            data = data.divide(data.std())
    return data


def treat_numpy(data: np.ndarray) -> np.ndarray:
    """
    Hàm xử lý dữ liệu dạng Numpy: chuẩn hóa, chuyển đổi, scale.

    Tham số:
        data: Dữ liệu numpy cần xử lý

    Trả về:
        Mảng numpy đã xử lý
    """
    data = data - np.nanmean(data)
    return data / np.nanstd(data, axis=0, ddof=1)


def sort_cols(data: pd.DataFrame) -> pd.DataFrame:
    """
    Hàm tiện ích sắp xếp các cột của DataFrame theo thứ tự tên cột.
    """
    return data.reindex(sorted(data.columns), axis=1)


def impute(data: pd.DataFrame) -> pd.DataFrame:
    """
    Hàm nội bộ thay thế giá trị thiếu bằng giá trị trung bình (chỉ dùng cho dữ liệu định lượng).
    """
    imputed = pd.DataFrame(0, data.index, data.columns)
    for column in list(data):
        average = data[column].mean(skipna=True)
        imputed[column] = data[column].fillna(average)
        assert math.isclose(imputed[column].mean(), average, rel_tol=1e-09, abs_tol=0.0)
    return imputed


def list_to_dummy(data: dict) -> pd.DataFrame:
    """
    Hàm nội bộ tạo ma trận thiết kế ngoài (outer design matrix) từ dict các biến.
    """
    matrix = pd.DataFrame()
    for col in data:
        dummy = pd.DataFrame(1, index=data[col], columns=[col])
        matrix = pd.concat([matrix, dummy], axis=1, sort=False)
    return matrix.fillna(0)


def rank(data: pd.Series) -> pd.Series:
    """
    Hàm nội bộ xếp hạng cho dữ liệu thứ tự (ordinal) và định danh (nominal).
    """
    unique = pd.Series(data.unique())
    ranked = unique.rank()
    lookup = pd.concat([unique, ranked], axis=1)
    lookup_series = pd.Series(lookup.iloc[:, 1].values, index=lookup.iloc[:, 0])
    return data.replace(lookup_series.to_dict()).astype(float)


def dummy(data: pd.Series) -> pd.DataFrame:
    """
    Hàm nội bộ tạo ma trận giả (dummy matrix) để tính toán với dữ liệu thứ tự/định danh.
    """
    unique = data.unique().size
    dummy = pd.DataFrame(0, data.index, range(1, unique + 1))
    for i in range(unique):
        dummy.loc[data[data == i + 1].index, i + 1] = 1
    return dummy


def groupby_mean(data: np.ndarray) -> np.ndarray:
    """
    Hàm nội bộ thực hiện chức năng groupby().mean() của Pandas trên mảng Numpy.
    """
    values = {}
    reduced = 0
    for i in range(data.shape[1]):
        index = data[0, i]
        if not index in values:
            values[index] = []
            reduced += 1
        values[index].append(data[1, i])
    means = np.zeros((2, reduced), dtype=np.float64)
    for i, index in enumerate(sorted(values.keys())):
        means[0, i] = index
        means[1, i] = np.mean(values[index])
    return means


class Value:
    """
    Class nội bộ mô hình hóa kiểu giá trị (value type)
    """
    def __init__(self, val):
        self.__value = val

    def __eq__(self, other):
        return self.__value == other.__value 

    def __ne__(self, other):
        return self.__value != other.__value 


class TopoSort:
    """
    Hàm nội bộ thực hiện sắp xếp topo (topological sort) sử dụng thuật toán Kahn
    """

    def __init__(self):
        self.__indegree = c.Counter()
        self.__children = {}
        self.__edges = []

    def append(self, src: str, dest: str):
        self.__edges.append((src, dest))
        self.__indegree[dest] += 1
        self.__indegree[src] += 0
        for vertex in [src, dest]:
            if vertex not in self.__children:
                self.__children[vertex] = []
        self.__children[src].append(dest)

    def order(self):
        ordered = []
        orphaned = c.deque([v for v in self.__indegree if self.__indegree[v] == 0])
        while orphaned:
            vertex = orphaned.popleft()  # FIFO: lấy phần tử đầu tiên (Kahn's algorithm chuẩn)
            ordered.append(vertex)
            for child in self.__children[vertex]:
                self.__indegree[child] -= 1
                if self.__indegree[child] == 0:
                    orphaned.append(child)
        for v in self.__indegree:
            if self.__indegree[v] != 0:
                raise ValueError("Structural graph contains cycles.")
        return ordered

    def elements(self):
        return self.__edges
