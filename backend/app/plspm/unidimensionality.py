import pandas as pd, numpy as np, app.plspm.util as util
from sklearn.decomposition import PCA
from app.plspm.config import Config
from app.plspm.mode import Mode

class Unidimensionality:
    """
    Class nội bộ tính toán các chỉ số độ tin cậy và tính đơn hướng cho các block.
    - Sử dụng PCA để kiểm tra eigenvalue, Cronbach's alpha, Dillon-Goldstein's rho
    """
    def __init__(self, config: Config, data: pd.DataFrame, correction: float):
        # Lưu cấu hình, dữ liệu và hệ số hiệu chỉnh
        self.__config = config
        self.__data = data
        self.__correction = correction

    def summary(self):
        """
        Thực hiện phân tích thành phần chính (PCA) để tính các chỉ số độ tin cậy:
        - Cronbach's alpha: độ tin cậy nội tại
        - Composite Reliability: độ tin cậy tổng hợp
        - Eigenvalue thành phần chính thứ nhất/thứ hai
        """
        summary = pd.DataFrame({"mode":                 pd.Series(dtype="str"),
                                "mvs":                  pd.Series(dtype="float"),
                                "cronbach_alpha":       pd.Series(dtype="float"),
                                # "composite_reliability ": pd.Series(dtype="float"),
                                "eig_1st":              pd.Series(dtype="float"),
                                "eig_2nd":              pd.Series(dtype="float")},
                                 index=list(self.__config.path()))
        for lv in list(self.__config.path()):
            mvs = len(self.__config.mvs(lv))
            summary.loc[lv, "mode"] = self.__config.mode(lv).name
            summary.loc[lv, "mvs"] = mvs
            if not self.__data.loc[:,self.__config.mvs(lv)].isnull().values.any():
                mvs_for_lvs = util.treat(self.__data.filter(self.__config.mvs(lv))) * self.__correction
                pca_input = mvs_for_lvs if mvs_for_lvs.shape[0] > mvs_for_lvs.shape[1] else mvs_for_lvs.transpose()
                pca = PCA()
                pca_scores = pca.fit_transform(pca_input)
                pca_std_dev = np.std(pca_scores, axis=0)
                summary.loc[lv, "eig_1st"] = pca_std_dev[0] ** 2
                summary.loc[lv, "eig_2nd"] = pca_std_dev[1] ** 2 if mvs > 1 else np.nan
                if (self.__config.mode(lv) == Mode.A):
                    if mvs > 1:
                        ca_numerator = 2 * np.tril(pca_input.corr(), -1).sum()
                        ca_denominator = pca_input.sum(axis=1).var() / self.__correction ** 2
                        ca = max(0, (ca_numerator / ca_denominator) * (mvs / (mvs - 1)))
                    else:
                        ca = np.nan
                    summary.loc[lv, "cronbach_alpha"] = ca
                    corr = np.corrcoef(np.column_stack((pca_input.values, pca_scores[:,0])), rowvar=False)[:,-1][:-1]
                    rho_numerator = sum(corr) ** 2
                    rho_denominator = rho_numerator + (mvs - np.sum(np.power(corr, 2)))
                    summary.loc[lv, "composite_reliability"] = rho_numerator / rho_denominator
        return summary
