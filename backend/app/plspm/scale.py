import app.plspm.util as util, pandas as pd, numpy as np
from enum import Enum


class _Numeric(util.Value):
    # Định nghĩa kiểu đo lường Numeric cho manifest variable

    def __init__(self):
        super().__init__(1)

    def scale(self, lv: str, mv: str, z_by_lv: pd.Series, weights) -> pd.DataFrame:
        # Chuẩn hóa dữ liệu numeric cho manifest variable
        data = weights.mv_grouped_by_lv(lv, mv)
        finite_elements = np.isfinite(data).sum()
        return util.treat_numpy(data) * np.sqrt(finite_elements / (finite_elements - 1))


class _Raw(util.Value):
    # Định nghĩa kiểu đo lường Raw cho manifest variable

    def __init__(self):
        super().__init__(2)

    def scale(self, lv: str, mv: str, z_by_lv: pd.Series, weights) -> pd.DataFrame:
        # Trả về dữ liệu gốc không chuẩn hóa
        return weights.mv_grouped_by_lv(lv, mv)


class _Ordinal(util.Value):
    # Định nghĩa kiểu đo lường Ordinal cho manifest variable

    def __init__(self):
        super().__init__(3)

    def _quantify(self, dummies, z_by_lv):
        # Tính toán giá trị lượng hóa cho từng mức của biến thứ tự
        scaling = [0] * (len(dummies[0]))
        for n in range(len(dummies[0])):
            scaling[n] = np.sum(dummies[:, n] * z_by_lv)
            scaling[n] = scaling[n] / np.sum(dummies[:, n])
        return scaling

    def _ordinalize(self, scaling, dummies, z_by_lv, sign: int):
        # Biến đổi dữ liệu ordinal để đảm bảo tính đơn điệu
        while True:
            ncols = len(dummies[0])
            for n in range(len(dummies[0]) - 1):
                if np.sign(scaling[n] - scaling[n + 1]) == sign:
                    dummies[:, n + 1] = dummies[:, n] + dummies[:, n + 1]
                    dummies = np.delete(dummies, n, axis=1)
                    scaling = self._quantify(dummies, z_by_lv)
                    break
            if len(dummies[0]) == 1 or len(dummies[0]) == ncols:
                break
        x_new = np.dot(dummies, scaling)
        return x_new, np.var(x_new)

    def scale(self, lv: str, mv: str, z_by_lv: np.ndarray, weights) -> pd.DataFrame:
        # Chuẩn hóa dữ liệu ordinal cho manifest variable
        z_by_lv = weights.get_Z_for_mode_b(lv, mv, z_by_lv)
        to_quantify = np.array([weights.mv_grouped_by_lv(lv, mv), z_by_lv])
        quantified = util.groupby_mean(to_quantify)
        x_quant_incr, var_incr = self._ordinalize(quantified[1, :], weights.dummies(mv).copy(), z_by_lv, 1)
        x_quant_decr, var_decr = self._ordinalize(quantified[1, :], weights.dummies(mv).copy(), z_by_lv, -1)
        x_quantified = -x_quant_decr if var_incr < var_decr else x_quant_incr
        scaled = util.treat_numpy(x_quantified) * weights.correction()
        return scaled


class _Nominal(util.Value):
    # Định nghĩa kiểu đo lường Nominal cho manifest variable

    def __init__(self):
        super().__init__(4)

    def scale(self, lv: str, mv: str, z_by_lv: np.ndarray, weights) -> pd.DataFrame:
        # Chuẩn hóa dữ liệu nominal cho manifest variable
        z_by_lv = weights.get_Z_for_mode_b(lv, mv, z_by_lv)
        to_quantify = np.array([weights.mv_grouped_by_lv(lv, mv), z_by_lv])
        quantified = util.groupby_mean(to_quantify)
        x_quantified = weights.dummies(mv).dot(quantified[1, :])
        return util.treat_numpy(x_quantified) * weights.correction()


class Scale(Enum):
    # Enum xác định kiểu đo lường của manifest variable khi tính toán với dữ liệu không metric
    NUM = _Numeric()
    RAW = _Raw()
    ORD = _Ordinal()
    NOM = _Nominal()
