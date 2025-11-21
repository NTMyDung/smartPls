import numpy as np, pandas as pd, scipy.linalg as linalg, app.plspm.util as util
from enum import Enum
from typing import Tuple


class _ModeA(util.Value):
    # Định nghĩa mode A (phản xạ - reflective) cho latent variable

    def __init__(self):
        super().__init__("A")

    def outer_weights_metric(self, data: pd.DataFrame, Z: pd.DataFrame, lv: str, mvs: list) -> pd.DataFrame:
        # Tính weights cho mode A với dữ liệu metric
        # Công thức: lấy trung bình có trọng số giữa latent variable và các manifest variable
        return (1 / data.shape[0]) * Z.loc[:, [lv]].T.dot(data.loc[:, mvs]).T

    def outer_weights_nonmetric(self, mv_grouped_by_lv: list, mv_grouped_by_lv_missing: list, Z: np.ndarray, lv: str,
                                correction: float) -> Tuple[np.ndarray, np.ndarray]:
        # Tính weights cho mode A với dữ liệu không metric
        # Nếu có missing, dùng np.nansum để tính toán; nếu không thì dùng dot product
        if lv in mv_grouped_by_lv_missing:
            weights = np.nansum(mv_grouped_by_lv[lv] * Z[:, np.newaxis], axis=0)
            weights = weights / np.sum(np.power(mv_grouped_by_lv_missing[lv] * Z[:, np.newaxis], 2), axis=0)
            Y = np.nansum(np.transpose(mv_grouped_by_lv[lv]) * weights[:, np.newaxis], axis=0)
            Y = Y / np.sum(np.power(np.transpose(mv_grouped_by_lv_missing[lv]) * weights[:, np.newaxis], 2), axis=0)
        else:   
            weights = np.dot(np.transpose(mv_grouped_by_lv[lv]), Z) / np.power(Z, 2).sum()
            Y = np.dot(mv_grouped_by_lv[lv], weights)
        Y = util.treat_numpy(Y) * correction
        return weights, Y


class _ModeB(util.Value):
    # Định nghĩa mode B (tạo thành - formative) cho latent variable

    def __init__(self):
        super().__init__("B")

    def outer_weights_metric(self, data: pd.DataFrame, Z: pd.DataFrame, lv: str, mvs: list) -> pd.DataFrame:
        # Tính weights cho mode B với dữ liệu metric
        # Sử dụng hồi quy tuyến tính (least squares) giữa manifest variable và latent variable
        w, _, _, _ = linalg.lstsq(data.loc[:, mvs], Z.loc[:, [lv]])
        return pd.DataFrame(w, columns=[lv], index=mvs)

    def outer_weights_nonmetric(self, mv_grouped_by_lv: list, mv_grouped_by_lv_missing: list, Z: pd.DataFrame, lv: str,
                                correction: float) -> Tuple[np.ndarray, np.ndarray]:
        # Tính weights cho mode B với dữ liệu không metric
        # Nếu có missing thì raise Exception (không hỗ trợ)
        if lv in mv_grouped_by_lv_missing:
            raise Exception("Missing nonmetric data is not supported in mode B. LV with missing data: " + lv)
        weights, _, _, _ = linalg.lstsq(mv_grouped_by_lv[lv], Z)
        Y = np.dot(mv_grouped_by_lv[lv], weights)
        Y = util.treat_numpy(Y) * correction
        return weights, Y


class Mode(Enum):
    """
    Enum xác định latent variable là reflective (mode A) hay formative (mode B) với manifest variable.
    - Mode.A: reflective (phản xạ)
    - Mode.B: formative (tạo thành)
    """
    A = _ModeA()
    B = _ModeB()
