import statsmodels.api as sm, numpy as np, pandas as pd, app.plspm.util as util
from enum import Enum


class _CentroidInnerWeightCalculator(util.Value):
    # Tính toán inner weights theo scheme centroid (dựa trên dấu của tương quan)

    def __init__(self):
        super().__init__("C")

    def calculate(self, path: pd.DataFrame, y: np.ndarray) -> np.ndarray:
        # Trả về dấu của ma trận tương quan giữa các latent variable
        return np.sign(np.corrcoef(y, rowvar=False) * (path + path.transpose()))


class _FactorialInnerWeightCalculator(util.Value):
    # Tính toán inner weights theo scheme factorial (dựa trên hiệp phương sai)

    def __init__(self):
        super().__init__("F")

    def calculate(self, path: pd.DataFrame, y: np.ndarray) -> np.ndarray:
        # Trả về ma trận hiệp phương sai giữa các latent variable
        return np.cov(y, rowvar=False) * (path + path.transpose())


class _PathInnerWeightCalculator(util.Value):
    # Tính toán inner weights theo scheme path (dựa trên hồi quy và tương quan)

    def __init__(self):
        super().__init__("P")

    def calculate(self, path: pd.DataFrame, y: np.ndarray) -> np.ndarray:
        # Tính toán inner weights cho từng latent variable theo scheme path
        E = path.values.astype(np.float64)
        for i in range(E.shape[0]):
            follow = path.iloc[i, :] == 1
            if path.iloc[i, :].sum() > 0:
                E[follow, i] = sm.OLS(y[:, i], y[:, follow]).fit().params
            predec = path.iloc[:, i] == 1
            if path.iloc[:, i].sum() > 0:
                E[predec, i] = np.corrcoef(np.column_stack((y[:, predec], y[:, i])), rowvar=False)[:,-1][:-1]
        return E


class Scheme(Enum):
    # Enum xác định scheme dùng để tính inner weights cho mô hình đường dẫn

    CENTROID = _CentroidInnerWeightCalculator()
    PATH = _PathInnerWeightCalculator()
    FACTORIAL = _FactorialInnerWeightCalculator()
