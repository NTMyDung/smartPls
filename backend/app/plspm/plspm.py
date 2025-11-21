import app.plspm.inner_summary as pis, app.plspm.config as c
import itertools
import pandas as pd, numpy as np, app.plspm.weights as w, app.plspm.outer_model as om, app.plspm.inner_model as im
from app.plspm.scheme import Scheme
from app.plspm.unidimensionality import Unidimensionality
from app.plspm.bootstrap import Bootstrap
from app.plspm.estimator import Estimator
import matplotlib.patches as patches


class Plspm:
    """
    Class chính để chạy phân tích PLS-PM.
    - Khởi tạo cấu hình, dữ liệu, các mô hình inner/outer
    - Thực hiện estimation, bootstrap, trích xuất kết quả
    """
    def __init__(self, data, path_matrix, blocks, modes, scheme='centroid', boot=False, nboot=200, seed=None):
        # Lưu các tham số đầu vào
        self.data = data
        self.path_matrix = path_matrix
        self.blocks = blocks
        self.modes = modes
        self.scheme = scheme
        self.boot = boot
        self.nboot = nboot
        self.seed = seed
        
        # Khởi tạo cấu hình mô hình
        self.config = c.Config(path_matrix, blocks, modes, scheme)
        
        # Khởi tạo bộ ước lượng
        self.estimator = Estimator(self.config, data)
        
        # Tính scores cho các latent variable
        self.scores = self.estimator.scores
        
        # Khởi tạo inner model (mô hình bên trong)
        self.inner_model = im.InnerModel(self.config.path_matrix, self.scores)
        
        # Khởi tạo outer model (mô hình bên ngoài)
        self.outer_model = om.OuterModel(blocks, self.scores, data, modes)
        
        # Nếu yêu cầu bootstrap thì khởi tạo bootstrap
        if boot:
            self.bootstrap = Bootstrap(self.config, data, nboot, seed)
        else:
            self.bootstrap = None

    def plot_smartpls_diagram(self, figsize=(14, 10), pvals=None):
        """
        Vẽ sơ đồ SmartPLS-like: latent variable (LV) là hình tròn xanh, 
        manifest variable (MV) là hình chữ nhật vàng, có đường nối và 
        thông số trên đường (hệ số và p-value).
        """
        import networkx as nx
        import matplotlib.pyplot as plt

        # Lấy thông tin
        path = self.path_matrix()
        lvs = list(path.index)
        mv_dict = {lv: self._get_mvs(lv) for lv in lvs}
        path_coef = self.path_coefficients()

        # Tạo đồ thị
        G = nx.DiGraph()

        # Thêm node latent variables
        for lv in lvs:
            G.add_node(lv, type='lv')

        # Thêm node manifest variables và cạnh LV → MV
        for lv, mvs in mv_dict.items():
            for mv in mvs:
                G.add_node(mv, type='mv')
                
                # Lấy loading từ outer_model DataFrame
                outer = self.outer_model()
                if mv in outer.index and 'loading' in outer.columns:
                    loading = outer.loc[mv, 'loading']
                else:
                    loading = np.nan
                
                # Lấy p-value nếu có cho cạnh LV→MV
                pval = None
                if pvals is not None:
                    try:
                        if isinstance(pvals, pd.Series) and isinstance(pvals.index, pd.MultiIndex):
                            pval = pvals.get((mv, lv), None)
                        elif isinstance(pvals, pd.Series):
                            pval = pvals.get(mv, None)
                    except Exception:
                        pval = None
                if not pd.isna(loading):
                    if pval is not None and not pd.isna(pval):
                        G.add_edge(lv, mv, label=f'{loading:.3f} ({pval:.3f})')
                    else:
                        G.add_edge(lv, mv, label=f'{loading:.3f}')
                else:
                    G.add_edge(lv, mv, label='')

        # Thêm các cạnh giữa các latent variables
        for src in path.columns:
            for tgt in path.index:
                if path.loc[tgt, src] == 1:
                    coef = path_coef.loc[tgt, src]
                    
                    # Nếu có pvals, lấy đúng p-value cho cạnh này
                    pval = None
                    if pvals is not None:
                        try:
                            if isinstance(pvals, pd.Series) and isinstance(pvals.index, pd.MultiIndex):
                                pval = pvals.get((tgt, src), None)
                            elif isinstance(pvals, pd.Series):
                                pval = pvals.get(tgt, None)
                        except Exception:
                            pval = None
                    if pval is not None and not pd.isna(pval):
                        G.add_edge(src, tgt, label=f'{coef:.3f} ({pval:.3f})')
                    else:
                        G.add_edge(src, tgt, label=f'{coef:.3f}')

        # LAYOUT
        # Tùy chỉnh vị trí thủ công cho các node để xếp thẳng hàng
        custom_pos = {}

        # Xác định các layer (cột) cho latent variables dựa vào thứ bậc trong path matrix
        # Layer 0: không có input (exogenous), layer 1: nhận input từ layer 0, ...
        from collections import defaultdict, deque
        path_bin = (path != 0).astype(int)
        indegree = {lv: path_bin.loc[lv].sum() for lv in lvs}
        layers = defaultdict(list)
        assigned = set()
        current_layer = 0
        queue = deque([lv for lv in lvs if indegree[lv] == 0])
        while queue:
            next_queue = deque()
            for lv in queue:
                layers[current_layer].append(lv)
                assigned.add(lv)
            
            # Tìm các node mà tất cả input đã được gán layer
            for lv in lvs:
                if lv in assigned:
                    continue
                preds = [src for src in path.columns if path.loc[lv, src] == 1]
                if all(pred in assigned for pred in preds):
                    next_queue.append(lv)
            queue = next_queue
            current_layer += 1

        # Gán vị trí cho latent variables tự động theo layer, căn giữa lớp sau với lớp trước
        prev_y = {}  # lưu toạ độ y của lớp trước
        for col, lvs_in_col in layers.items():
            n = len(lvs_in_col)
            if col == 0:
                # Lớp đầu, xếp đều từ y=0
                for i, lv in enumerate(lvs_in_col):
                    custom_pos[lv] = (col * 3, -i * 8)
                prev_y[col] = [custom_pos[lv][1] for lv in lvs_in_col]
            else:
                prev_col = col - 1
                prev_ys = prev_y.get(prev_col, [0])
                center_prev = np.mean(prev_ys)
                if col == 1:
                    step_y = 6
                else:
                    step_y = 4
                total_height = (n - 1) * step_y
                start_y = center_prev + total_height / 2
                for i, lv in enumerate(lvs_in_col):
                    y = start_y - i * step_y 
                    custom_pos[lv] = (col * 3, y*1.2 + 3)
                    if i == 1: custom_pos[lv] = (col * 3, y*1.2 - 2)
                prev_y[col] = [custom_pos[lv][1] for lv in lvs_in_col]

        # Gán vị trí cho manifest variables quanh mỗi latent variable
        # Gán vị trí cho manifest variables dựa vào layer
        for col, lvs_in_col in layers.items():
            for i, lv in enumerate(lvs_in_col):
                if lv in custom_pos:
                    x, y = custom_pos[lv]
                    mvs = mv_dict.get(lv, [])
                    for j, mv in enumerate(mvs):
                        k = len(mvs)
                        
                        if col == 0:
                            # Trái
                            offset = (j - (k - 1) / 2) * 1.5
                            custom_pos[mv] = (x - 1.7, y + offset)
                        elif col == 1:
                            
                            # Xếp hàng ngang: biến đầu ở trên latent variable,
                            if i == 0: # Trên LV
                                if j != 1:
                                    custom_pos[mv] = (x + (j-1) * 1.2, y + 3.5)
                                    
                                    # Đánh dấu MV chính (j==1) để shrinkB=25 khi vẽ
                                    G.nodes[mv]['main_mv'] = False
                                else:
                                    custom_pos[mv] = (x + (j-1) * 0.8, y + 5)
                                    G.nodes[mv]['main_mv'] = True
                            else: 
                                # Dưới LV
                                if j != 1:
                                    custom_pos[mv] = (x + (j-1) * 1.2, y - 3.5)
                                    G.nodes[mv]['main_mv'] = False
                                else:
                                    custom_pos[mv] = (x + (j-1) * 0.8, y - 5)
                                    G.nodes[mv]['main_mv'] = True
                        else:
                            # Phải
                            mean = (j - (k - 1) / 2) # * 3.5
                            custom_pos[mv] = (x + 2.2 - abs(3.5 - j)*0.3, y + mean*2.5)
                            G.nodes[mv]['main_mv'] = True
                            if 2 <= j <= 5:
                                G.nodes[mv]['main_mv'] = False
                            else:
                                G.nodes[mv]['main_mv'] = True

        pos = custom_pos

        # Phân loại node
        lv_nodes = [n for n, d in G.nodes(data=True) if d['type'] == 'lv']
        mv_nodes = [n for n, d in G.nodes(data=True) if d['type'] == 'mv']

        # Vẽ
        plt.figure(figsize=figsize)
        nx.draw_networkx_nodes(G, pos, nodelist=lv_nodes, node_color='dodgerblue', node_shape='o', node_size=2500)
        # nx.draw_networkx_nodes(G, pos, nodelist=mv_nodes, node_color='yellow', node_shape='s', node_size=1500)
        ax = plt.gca()

        for node in mv_nodes:
            if node in pos:  # Kiểm tra vị trí tồn tại
                x, y = pos[node]
                width = 0.6
                height = 0.8
                rect = patches.Rectangle(
                    (x - width/2, y - height/2), width, height,
                    linewidth=0.5, edgecolor='black', facecolor='yellow', zorder=5
                )
                ax.add_patch(rect)
                ax.text(x, y, node, ha='center', va='center', fontsize=9, zorder=6)

        from matplotlib.patches import FancyArrowPatch

        ax = plt.gca()

        for u, v in G.edges():
            # Gán shrinkB cho các node đã đánh dấu 
            shrinkB = 12 if G.nodes.get(v, {}).get('main_mv', False) else (20 if G.nodes.get(v, {}).get('ce_mv', False) else 27)
            arrow = FancyArrowPatch(pos[u], pos[v],
                                    connectionstyle="arc3",
                                    arrowstyle='-|>',
                                    color='black',
                                    mutation_scale=10,
                                    linewidth=0.5,
                                    shrinkB=shrinkB,
                                    )
            ax.add_patch(arrow)

        # Xác định latent variable nào có MV xếp bên dưới để đặt label lên trên
        lv_label_pos = {}
        for lv in lv_nodes:
            # Kiểm tra nếu có MV xếp bên dưới (col==1, i!=0)
            label_above = False
            for col, lvs_in_col in layers.items():
                if lv in lvs_in_col and col == 1:
                    i = lvs_in_col.index(lv)
                    if i != 0:
                        label_above = True
            if label_above:
                lv_label_pos[lv] = (pos[lv][0], pos[lv][1] + 2)
            else:
                lv_label_pos[lv] = (pos[lv][0], pos[lv][1] - 1.7)
        nx.draw_networkx_labels(G, lv_label_pos, labels={lv: lv for lv in lv_nodes}, font_size=10, font_weight='normal', verticalalignment='top')
        
        # Vẽ label cho manifest variable như cũ (giữa hình chữ nhật)
        mv_label_pos = {mv: pos[mv] for mv in mv_nodes}
        nx.draw_networkx_labels(G, mv_label_pos, labels={mv: mv for mv in mv_nodes}, font_size=10, font_weight='normal')

        # Thêm R squared vào giữa hình tròn latent variable
        # try:
        #     r2_df = self.inner_summary()
        #     if 'R squared' in r2_df.columns:
        #         r2_col = 'R squared'
        #     elif 'r_squared' in r2_df.columns:
        #         r2_col = 'r_squared'
        #     else:
        #         r2_col = None
        # except Exception:
        #     r2_col = None
        # if r2_col:
        #     for lv in lv_nodes:
        #         r2_val = r2_df[r2_col][lv] if lv in r2_df.index else None
        #         if r2_val is not None and not pd.isna(r2_val) and abs(r2_val) > 1e-8:
        #             plt.text(pos[lv][0], pos[lv][1], f'{r2_val:.3f}',
        #                      fontsize=9, color='white', ha='center', va='center', fontweight='bold', bbox=dict(facecolor='dodgerblue', edgecolor='none', boxstyle='circle,pad=0.35', alpha=0))

        edge_labels = nx.get_edge_attributes(G, 'label')
        nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_labels, font_color='black', font_size=9, rotate=False)

        plt.axis('off')
        
        # plt.title('SmartPLS-like Path Diagram with Coefficients and p-values', fontsize=14)
        plt.tight_layout()
        plt.show()

    def f2(self) -> pd.DataFrame:
        """
        Tính chỉ số f2 effect size cho từng predictor trên từng endogenous latent variable.
        f2 = (R2_included - R2_excluded) / (1 - R2_included)
        Trả về DataFrame: index là endogenous LV, columns là predictor LV, value là f2 (làm tròn 3 số).
        """
        path = self.path_matrix()
        scores = self.scores()
        r2_full = self.inner_summary()
        if 'R squared' in r2_full.columns:
            r2_col = 'R squared'
        elif 'r_squared' in r2_full.columns:
            r2_col = 'r_squared'
        else:
            raise Exception('Không tìm thấy R squared trong inner_summary.')
        f2_dict = {}
        for target in path.index:
            predictors = path.columns[path.loc[target] == 1].tolist()
            if not predictors or target not in r2_full.index:
                continue
            r2_included = r2_full.loc[target, r2_col]
            f2_row = {}
            for pred in predictors:
                # Loại predictor này khỏi mô hình, tính lại R2
                reduced_predictors = [p for p in predictors if p != pred]
                if not reduced_predictors:
                    continue
                X = scores[reduced_predictors]
                y = scores[target]
                try:
                    from sklearn.linear_model import LinearRegression
                    model = LinearRegression().fit(X, y)
                    r2_excluded = model.score(X, y)
                except Exception:
                    r2_excluded = np.nan
                if pd.isna(r2_included) or pd.isna(r2_excluded) or r2_included == 1:
                    f2_val = np.nan
                else:
                    f2_val = (r2_included - r2_excluded) / (1 - r2_included)
                f2_row[pred] = round(f2_val, 3) if not pd.isna(f2_val) else np.nan
            if f2_row:
                f2_dict[target] = f2_row
        return pd.DataFrame(f2_dict).T
    
    def data(self) -> pd.DataFrame:
        """
        Trả về dữ liệu gốc (DataFrame) đã được truyền vào khi khởi tạo đối tượng Plspm.
        """
        if hasattr(self, '_original_data') and self._original_data is not None:
            return self._original_data
        raise AttributeError("Không tìm thấy dữ liệu gốc. Đảm bảo đã khởi tạo Plspm với dữ liệu hợp lệ.")

    def path_matrix(self) -> pd.DataFrame:
        """
        Trả về ma trận đường dẫn (path matrix) giữa các latent variable, dạng DataFrame.
        """
        if hasattr(self, '_config') and self._config is not None:
            return self._config.path()
        raise AttributeError("Không tìm thấy config để lấy path matrix.")

    def htmt(self) -> pd.DataFrame:
        """
        Tính Heterotrait-Monotrait Ratio (HTMT) theo đúng thuật toán tham khảo.
        Sử dụng np.corrcoef cho từng cặp biến, chia cho sqrt(mean mono_i * mean mono_j).
        """
        data = self.data()  # Dữ liệu gốc gồm các manifest variables
        lv_names = self._get_all_lvs()
        htmt_matrix = pd.DataFrame(np.nan, index=lv_names, columns=lv_names)

        for i in range(len(lv_names)):
            for j in range(i):
                lv_i = lv_names[i]
                lv_j = lv_names[j]
                try:
                    mvs_i = self._get_mvs(lv_i)
                    mvs_j = self._get_mvs(lv_j)

                    # Tính tương quan giữa tất cả các cặp biến (MV_i x MV_j)
                    hetero = [abs(np.corrcoef(data[f1], data[f2])[0, 1]) for f1, f2 in itertools.product(mvs_i, mvs_j)]
                    # Tính tương quan giữa các biến cùng LV (monotrait)
                    mono_i = [abs(np.corrcoef(data[f1], data[f2])[0, 1]) for f1, f2 in itertools.combinations(mvs_i, 2)]
                    mono_j = [abs(np.corrcoef(data[f1], data[f2])[0, 1]) for f1, f2 in itertools.combinations(mvs_j, 2)]

                    numerator = np.mean(hetero)
                    denominator = np.sqrt(np.mean(mono_i) * np.mean(mono_j)) if mono_i and mono_j else np.nan

                    if denominator and denominator > 0:
                        htmt_val = numerator / denominator
                        htmt_matrix.loc[lv_i, lv_j] = round(htmt_val, 3)
                    else:
                        htmt_matrix.loc[lv_i, lv_j] = np.nan

                except Exception:
                    htmt_matrix.loc[lv_i, lv_j] = np.nan

        return htmt_matrix

    def fornell_larcker(self) -> pd.DataFrame:
        """Tính Fornell-Larcker criterion matrix giống như trong SmartPLS: √AVE ở đường chéo chính, tam giác trên để trống."""
        summary = self.inner_summary()
        ave = summary['ave'] if 'ave' in summary.columns else None
        if ave is None:
            raise ValueError('AVE not found in inner summary.')
        
        scores = self.scores()
        cor = scores.corr()

        # Khởi tạo ma trận mới với toàn bộ là NaN
        fl_matrix = pd.DataFrame(np.nan, index=cor.index, columns=cor.columns)

        for i in range(len(cor.columns)):
            for j in range(i + 1):  # chỉ duyệt tam giác dưới + đường chéo
                lv_i = cor.columns[i]
                lv_j = cor.columns[j]
                if lv_i == lv_j:
                    fl_matrix.loc[lv_i, lv_j] = round(np.sqrt(ave[lv_i]), 3)
                else:
                    fl_matrix.loc[lv_i, lv_j] = round(cor.loc[lv_i, lv_j], 3)

        return fl_matrix


    def outer_vif(self) -> pd.DataFrame:
        """
        Variance Inflation Factor (VIF) cho từng manifest variable.
        Trả về một bảng có cột: Latent Variable, Manifest Variable, VIF
        """
        from statsmodels.stats.outliers_influence import variance_inflation_factor

        vif_rows = []
        for lv in self._get_all_lvs():
            try:
                mvs = self._get_mvs(lv)
                X = self._get_data_for_mvs(mvs)

                if X.shape[1] < 2:
                    continue  # Không thể tính VIF nếu chỉ có 1 biến

                for i, mv in enumerate(mvs):
                    vif_value = variance_inflation_factor(X.values, i)
                    vif_rows.append({
                        'Latent Variable': lv,
                        'Manifest Variable': mv,
                        'VIF': round(vif_value, 3)
                    })
            except Exception as e:
                print(f"Lỗi khi tính VIF cho {lv}: {e}")

        return pd.DataFrame(vif_rows)

    def inner_vif(self) -> pd.DataFrame:
        """Tính Inner VIF Values chỉ giữa các biến độc lập trực tiếp liên kết tới biến phụ thuộc."""
        from statsmodels.stats.outliers_influence import variance_inflation_factor

        scores = self.scores()
        lv_names = scores.columns.tolist()
        paths = self.path_matrix()  # Dạng DataFrame với 1 nếu có quan hệ nhân quả

        vif_matrix = pd.DataFrame(np.nan, index=lv_names, columns=lv_names)

        for target_lv in lv_names:
            # predictors là các latent variable có mũi tên đi vào target_lv (tức là cột target_lv == 1)
            predictors = paths.columns[paths.loc[target_lv] == 1].tolist()

            if len(predictors) < 2:
                continue  # Không tính VIF nếu chỉ có 1 predictor

            try:
                X = scores[predictors]
                for i, pred in enumerate(predictors):
                    vif_val = variance_inflation_factor(X.values, i)
                    vif_matrix.loc[target_lv, pred] = round(vif_val, 3)
            except Exception as e:
                pass  # Im lặng nếu lỗi, để NaN

        return vif_matrix



    def _get_mvs(self, lv):
        # Internal: get manifest variables for a latent variable
        # Lấy trực tiếp từ self._config nếu có
        if hasattr(self, '_config') and self._config is not None:
            try:
                return self._config.mvs(lv)
            except Exception:
                return []

    def _get_all_lvs(self):
        # Internal: get all latent variables
        return list(self.scores().columns)

    def _get_data_for_mvs(self, mvs):
        # Internal: get data for manifest variables
        if not mvs or mvs is None or (isinstance(mvs, list) and len(mvs) == 0):
            return pd.DataFrame()
        # Lấy từ outer model nếu có method get_data
        if hasattr(self.__outer_model, 'get_data'):
            data = self.__outer_model.get_data(mvs)
            if not data.empty:
                return data
        # Fallback: use scores if not found
        try:
            return self.scores()[mvs]
        except Exception:
            return pd.DataFrame()

    def __init__(self, data: pd.DataFrame, config: c.Config, scheme: Scheme = Scheme.CENTROID,
                 iterations: int = 100, tolerance: float = 0.000001, bootstrap: bool = False,
                 bootstrap_iterations: int = 100, processes: int = 2):
        """Tạo một đối tượng của bộ tính toán mô hình đường dẫn (path model calculator).

            Tham số (Args):
                data: Một Pandas DataFrame chứa tập dữ liệu cần phân tích.
                config: Một instance của Config (:obj:.config.Config).
                scheme: Phương pháp trọng số inner để sử dụng:
                Scheme.CENTROID (mặc định)
                Scheme.FACTORIAL
                Scheme.PATH
                iterations: Số vòng lặp tối đa để thuật toán hội tụ (mặc định và tối thiểu 100).
                tolerance: Tiêu chí sai số cho vòng lặp (mặc định 0.000001, phải > 0).
                bootstrap: Có thực hiện xác thực bootstrap hay không (mặc định là không thực hiện).
                bootstrap_iterations: Số lượng mẫu bootstrap nếu bật xác thực bootstrap (mặc định và tối thiểu 100).
                processes: Số process sử dụng trong bootstrap (bootstrap_iterations phải chia hết cho processes).
                Ngoại lệ (Raises):
                    Exception: nếu thuật toán không hội tụ, hoặc cấu hình yêu cầu không thể tính toán được.
        """

        if iterations < 100:
            iterations = 100
        assert tolerance > 0
        assert scheme in Scheme
        if bootstrap_iterations < 10:
            bootstrap_iterations = 100
        assert processes > 0
        assert bootstrap_iterations % processes == 0

        estimator = Estimator(config)
        filtered_data = config.filter(data)
        correction = np.sqrt(filtered_data.shape[0] / (filtered_data.shape[0] - 1))

        calculator = w.WeightsCalculatorFactory(config, iterations, tolerance, correction, scheme)
        final_data, scores, weights = estimator.estimate(calculator, filtered_data)
        config = estimator.config()

        self._original_data = data.copy() if isinstance(data, pd.DataFrame) else data
        self._config = config  # Lưu lại config để dùng cho _get_mvs
        self.__inner_model = im.InnerModel(config.path(), scores)
        self.__outer_model = om.OuterModel(final_data, scores, weights, config.odm(config.path()), self.__inner_model.r_squared())
        self.__inner_summary = pis.InnerSummary(config, self.__inner_model.r_squared(),
                                                self.__inner_model.r_squared_adj(), self.__outer_model.model())
        self.__unidimensionality = Unidimensionality(config, filtered_data, correction)
        self.__scores = scores
        self.__bootstrap = None
        if bootstrap:
            if (filtered_data.shape[0] < 10):
                raise Exception("Bootstrapping could not be performed, at least 10 observations are required.")
            self.__bootstrap = Bootstrap(config, filtered_data, self.__inner_model, self.__outer_model, calculator,
                                         bootstrap_iterations, processes)

    def scores(self) -> pd.DataFrame:
        """Lấy các điểm số của biến tiềm ẩn (latent variable scores)
            Trả về (Returns):
                Một DataFrame chứa các điểm số của biến tiềm ẩn, mỗi cột tương ứng với một biến tiềm ẩn.
                Index của DataFrame này giống với index của dữ liệu đầu vào (data) đã truyền vào.
        """
        return self.__scores

    def outer_model(self) -> pd.DataFrame:
        """Lấy mô hình outer (outer model). 
        Trả về một DataFrame với các cột weight (trọng số), loading (tải nhân tố), communality (độ chung) và redundancy (thừa dư), và mỗi hàng tương ứng với một biến hiện tượng (manifest variable).        """
       
        return self.__outer_model.model()

    def inner_model(self) -> pd.DataFrame:
        """
       Lấy mô hình inner cho các biến tiềm ẩn nội sinh. 
       Trả về một DataFrame với mỗi hàng tương ứng một biến tiềm ẩn có đường dẫn trực tiếp đến nó, và các cột estimate (ước lượng), std error (sai số chuẩn), t và p>|t|.        """
        return self.__inner_model.inner_model()

    def print_inner_with_f2(self):
        """
        In ra bảng inner model kèm theo f2 effect size cho từng predictor.
        """
        inner = self.inner_model()
        f2_df = self.f2()
        print("Inner Model:")
        print(inner)
        print("\nf2 Effect Size:")
        print(f2_df)

    def path_coefficients(self) -> pd.DataFrame:
        """
        Lấy ma trận hệ số đường dẫn

        Trả về:
            Một DataFrame có dạng giống ma trận đường dẫn (Path matrix) truyền vào :class:`plspm.config.Config`, với các hệ số đường dẫn tương ứng ở mỗi ô
        """
        return self.__inner_model.path_coefficients()

    def crossloadings(self) -> pd.DataFrame:
        """
        Lấy ma trận crossloadings

        Trả về:
            Một DataFrame với các biến tiềm ẩn là cột và các biến quan sát là chỉ số dòng
        """
        return self.__outer_model.crossloadings()

    def inner_summary(self) -> pd.DataFrame:
        """
        Lấy bảng tổng hợp inner model

        Trả về:
            Một DataFrame với các biến tiềm ẩn là chỉ số dòng, các cột gồm loại biến (Exogenous/Endogenous), R squared, block communality, mean redundancy, và AVE (phương sai trích trung bình)
        """
        return self.__inner_summary.summary()

    def goodness_of_fit(self) -> float:
        """
        Lấy chỉ số goodness-of-fit

        Trả về:
            Giá trị goodness-of-fit
        """
        return self.__inner_summary.goodness_of_fit()

    def effects(self) -> pd.DataFrame:
        """
        Lấy hiệu ứng trực tiếp, gián tiếp và tổng cho từng đường dẫn

        Trả về:
            Một DataFrame với mỗi đường dẫn là một dòng, các cột gồm hiệu ứng trực tiếp, gián tiếp và tổng cho đường dẫn đó
        """
        return self.__inner_model.effects()

    def unidimensionality(self) -> pd.DataFrame:
        """
        Lấy kết quả kiểm tra tính đơn hướng của các block (chỉ có ý nghĩa với block reflective / mode A)

        Trả về:
            Một DataFrame với các biến tiềm ẩn là chỉ số dòng, các cột gồm Cronbach's Alpha, Dillon-Goldstein Rho, và các giá trị riêng (eigenvalue) của thành phần chính thứ nhất và thứ hai
        """
        return self.__unidimensionality.summary()

    def bootstrap(self) -> Bootstrap:
        """
        Lấy kết quả kiểm định bootstrap, nếu có yêu cầu

        Trả về:
            Một đối tượng :class:`.bootstrap.Bootstrap` có thể truy vấn kết quả bootstrap

        Ngoại lệ:
            Exception: Nếu không yêu cầu kiểm định bootstrap hoặc số lượng quan sát quá ít (<10)
        """
        if self.__bootstrap is None:
            raise Exception("To perform bootstrap validation, set the parameter bootstrap to True when calling Plspm")
        return self.__bootstrap
