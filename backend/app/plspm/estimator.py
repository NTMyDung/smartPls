
import plspm.config as c, pandas as pd, numpy.testing as npt
from plspm.weights import WeightsCalculatorFactory
from plspm.scale import Scale
from typing import Tuple


class Estimator:
    """
    Class thực hiện ước lượng mô hình PLS-PM.
    - Đảm bảo thread-safe khi chạy song song.
    - Hỗ trợ higher-order construct (HOC): latent variable được tạo từ các latent variable con.
    """
    def __init__(self, config: c.Config):
        # Lưu lại cấu trúc đường dẫn cho HOC (nếu có)
        self.__hoc_path_first_stage = self.hoc_path_first_stage(config)

    def estimate(self, calculator: WeightsCalculatorFactory, data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        # Hàm ước lượng mô hình, trả về final_data, scores, weights
        # Đảm bảo thread-safe bằng cách clone calculator
        calculator = calculator.clone()
        config = calculator.config()
        treated_data = config.treat(data)  # Chuẩn hóa dữ liệu

        hocs = config.hoc()  # Lấy cấu trúc HOC nếu có
        if hocs is not None:
            path = self.__hoc_path_first_stage

        # Ước lượng lần đầu với đường dẫn ban đầu
        final_data, scores, weights = calculator.calculate(treated_data, path)

        # Nếu có HOC, ước lượng lại với các latent variable con làm manifest variable cho HOC
        if hocs is not None:
            scale = None if config.metric() else Scale.NUM
            for hoc in hocs:
                new_mvs = []
                for lv in hocs[hoc]:
                    mv_new = lv
                    treated_data[mv_new] = scores[lv]
                    new_mvs.append(c.MV(mv_new, scale))
                config.add_lv(hoc, config.mode(hoc), *new_mvs)
            final_data, scores, weights = calculator.calculate(treated_data, config.path())
        self.__config = config

        return final_data, scores, weights

    def config(self):
        # Trả về cấu hình mô hình sau khi đã cập nhật HOC
        return self.__config

    def hoc_path_first_stage(self, config: c.Config) -> pd.DataFrame:
        # Hàm xây dựng đường dẫn cho HOC ở lần ước lượng đầu tiên
        # - Tạo đường dẫn từ các latent variable exogenous tới các latent variable con của HOC
        # - Tạo đường dẫn từ các latent variable con của HOC tới các latent variable endogenous
        path = config.path()
        for hoc, lvs in config.hoc().items():
            structure = c.Structure(path)
            exogenous = path.loc[hoc]
            endogenous = path.loc[:, hoc]
            # Tạo đường dẫn từ exogenous tới các latent variable con
            for lv in list(exogenous[exogenous == 1].index):
                structure.add_path([lv], lvs)
            # Tạo đường dẫn từ các latent variable con tới endogenous
            for lv in list(endogenous[endogenous == 1].index):
                structure.add_path(lvs, [lv])
            # Loại bỏ HOC khỏi ma trận đường dẫn
            path = structure.path().drop(hoc).drop(hoc, axis=1)
        return path
