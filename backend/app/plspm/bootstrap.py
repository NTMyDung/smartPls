import app.plspm.config as c, pandas as pd, numpy as np, app.plspm.inner_model as im, app.plspm.outer_model as om, time
from multiprocessing import Process, Queue
from queue import Empty
from app.plspm.weights import WeightsCalculatorFactory
from app.plspm.estimator import Estimator

def _create_summary(data: pd.DataFrame, original):
    # Hàm tổng hợp kết quả bootstrap cho từng chỉ số (weight, loading, path, ...)
    # Trả về DataFrame gồm các thống kê: giá trị gốc, trung bình, std, percentiles, t-statistic
    summary = pd.DataFrame(0.0, index=data.columns, columns=["original", "mean", "std.error", "perc.025", "perc.975", "t stat."])
    summary.loc[:, "mean"] = data.mean(axis=0)
    summary.loc[:, "std.error"] = data.std(axis=0)
    summary.loc[:, "perc.025"] = data.quantile(0.025, axis=0)
    summary.loc[:, "perc.975"] = data.quantile(0.975, axis=0)
    summary.loc[:, "original"] = original
    summary.loc[:, "t stat."] = original / data.std(axis=0)
    return summary


class BootstrapProcess(Process):
    # Class này đại diện cho một process bootstrap chạy song song
    def __init__(self, queue: Queue, config: c.Config, data: pd.DataFrame, inner_model: im.InnerModel, calculator: WeightsCalculatorFactory, iterations: int):
        super(BootstrapProcess, self).__init__()
        self.__queue = queue
        self.__config = config
        self.__data = data
        self.__inner_model = inner_model
        self.__calculator = calculator
        self.__iterations = iterations

    def run(self):
        # Chạy bootstrap cho một phần dữ liệu, lưu kết quả vào queue
        weights = pd.DataFrame(columns=self.__data.columns, dtype="float")
        r_squared = pd.DataFrame(columns=self.__inner_model.r_squared().index, dtype="float")
        total_effects = pd.DataFrame(columns=self.__inner_model.effects().index, dtype="float")
        paths = pd.DataFrame(columns=self.__inner_model.effects().index, dtype="float")
        loadings = pd.DataFrame(columns=self.__data.columns, dtype="float")

        observations = self.__data.shape[0]
        estimator = Estimator(self.__config)
        for i in range(0, self.__iterations):
            try:
                # Lấy mẫu bootstrap (có lặp)
                boot_observations = np.random.randint(observations, size=observations)
                _final_data, _scores, _weights = estimator.estimate(self.__calculator, self.__data.iloc[boot_observations, :])
                # Lưu kết quả từng vòng lặp
                weights = pd.concat([weights, _weights.T], ignore_index = True)
                inner_model = im.InnerModel(self.__config.path(), _scores)
                r_squared = pd.concat([r_squared, inner_model.r_squared().to_frame().T], ignore_index=True)
                total_effects = pd.concat([total_effects,
                                           inner_model.effects().loc[:, "total"].to_frame().T], ignore_index=True)
                paths = pd.concat([paths,
                                   inner_model.effects().loc[:, "direct"].to_frame().T], ignore_index=True)
                loadings = pd.concat([loadings,
                                      (_scores.apply(lambda s: _final_data.corrwith(s)) * self.__config.odm(self.__config.path())).sum(axis=1).to_frame().T], ignore_index=True)
            except:
                pass
        # Đưa kết quả vào queue để tổng hợp
        results = {}
        results["weights"] = weights
        results["r_squared"] = r_squared
        results["total_effects"] = total_effects
        results["paths"] = paths
        results["loadings"] = loadings
        self.__queue.put(results)


class Bootstrap:
    """
    Class thực hiện bootstrap cho mô hình PLS-PM:
    - Chạy nhiều process song song để lấy mẫu bootstrap
    - Tổng hợp kết quả, tính các thống kê, p-value cho từng chỉ số
    - Trả về các bảng kết quả: weights, r_squared, effects, paths, loadings
    """
    def __init__(self, config: c.Config, data: pd.DataFrame, inner_model: im.InnerModel, outer_model: om.OuterModel,
                 calculator: WeightsCalculatorFactory, iterations: int, num_processes: int):
        # Khởi tạo các DataFrame lưu kết quả từng chỉ số
        weights = pd.DataFrame(columns=data.columns, dtype="float")
        r_squared = pd.DataFrame(columns=inner_model.r_squared().index, dtype="float")
        total_effects = pd.DataFrame(columns=inner_model.effects().index, dtype="float")
        paths = pd.DataFrame(columns=inner_model.effects().index, dtype="float")
        loadings = pd.DataFrame(columns=data.columns, dtype="float")

        # Tạo queue và các process bootstrap
        queue = Queue()
        processes = []
        for t in range(0, num_processes):
            process = BootstrapProcess(queue, config, data, inner_model, calculator, iterations // num_processes)
            process.start()
            processes.append(process)

        # Tổng hợp kết quả từ các process
        running = list(processes)
        while running:
            try:
                while True:
                    results = queue.get(False)
                    weights = pd.concat([weights, results["weights"]])
                    r_squared = pd.concat([r_squared, results["r_squared"]])
                    total_effects = pd.concat([total_effects, results["total_effects"]])
                    paths = pd.concat([paths, results["paths"]])
                    loadings = pd.concat([loadings, results["loadings"]])
            except Empty:
                pass
            time.sleep(1)
            if not queue.empty():
                continue
            running = [process for process in running if process.is_alive()]

        # Tính các thống kê tổng hợp cho từng chỉ số
        self.__weights = _create_summary(weights, outer_model.model().loc[:, "weight"])
        self.__r_squared = _create_summary(r_squared, inner_model.r_squared()).loc[inner_model.endogenous(), :]
        self.__total_effects = _create_summary(total_effects, inner_model.effects().loc[:, "total"])

        # Tính p-value cho paths (đường dẫn giữa latent variable)
        summary_paths = _create_summary(paths, inner_model.effects().loc[:, "direct"])
        from scipy.stats import norm
        tvals = summary_paths["t stat."]
        # summary_paths["p_o"] = (1 - norm.cdf(tvals)).round(3)
        summary_paths["p_t"] = (2 * (1 - norm.cdf(np.abs(tvals)))).round(3)
        self.__paths = summary_paths

        # Tính p-value cho loadings (hệ số tải của manifest variable)
        summary_loadings = _create_summary(loadings, outer_model.model().loc[:, "loading"])
        tvals_load = summary_loadings["t stat."]
        # summary_loadings["p_o"] = (1 - norm.cdf(tvals_load)).round(3)
        summary_loadings["p_t"] = (2 * (1 - norm.cdf(np.abs(tvals_load)))).round(3)
        self.__loading = summary_loadings

    def weights(self) -> pd.DataFrame:
        """
        Trả về bảng outer weights (trọng số ngoài) đã được bootstrap.
        """
        return self.__weights

    def r_squared(self) -> pd.DataFrame:
        """
        Trả về bảng R squared cho các latent variable đã được bootstrap.
        """
        return self.__r_squared

    def total_effects(self) -> pd.DataFrame:
        """
        Trả về bảng tổng hiệu ứng (total effects) cho các đường dẫn đã được bootstrap.
        """
        return self.__total_effects

    def paths(self) -> pd.DataFrame:
        """
        Trả về bảng hiệu ứng trực tiếp (direct effects) cho các đường dẫn đã được bootstrap.
        """
        return self.__paths[self.__paths["mean"] != 0]

    def loading(self) -> pd.DataFrame:
        """
        Trả về bảng hệ số tải (loading) của các manifest variable đã được bootstrap.
        """
        return self.__loading
