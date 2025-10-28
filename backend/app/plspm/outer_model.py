import pandas as pd, numpy as np


class OuterModel:
    """
    Class tính toán các chỉ số của outer model (mô hình bên ngoài):
    - Tính hệ số weights, loadings, crossloadings, communality, redundancy cho từng manifest variable
    """

    def __init__(self, data: pd.DataFrame, scores: pd.DataFrame, weights: pd.DataFrame, odm: pd.DataFrame,
                 r_squared: pd.Series):
        
        # Lưu lại data gốc để truy xuất manifest variable
        self.__data = data.copy()
        
        # Tính crossloadings: tương quan giữa từng manifest variable và từng latent variable
        self.__crossloadings = pd.DataFrame(0.0, index=data.columns, columns=scores.columns)
        for lv in scores.columns:
            for mv in data.columns:
                self.__crossloadings.loc[mv, lv] = np.corrcoef(data[mv], scores[lv])[0, 1]
        
        # Tính loadings: lấy hệ số tương quan trực tiếp giữa manifest variable và latent variable
        loading = pd.DataFrame(0.0, index=data.columns, columns=["loading"])
        for lv in scores.columns:
            for mv in data.columns:
                if odm.loc[mv, lv] == 1:
                    loading.loc[mv, "loading"] = self.__crossloadings.loc[mv, lv]
        
        # Tính communality: bình phương hệ số tải
        communality = loading.apply(lambda s: pow(s, 2))
        communality.columns = ["communality"]
        
        # Tính redundancy: communality nhân với R² của latent variable
        r_squared_aux = odm.dot(pd.DataFrame(np.diag(r_squared), index=r_squared.index, columns=r_squared.index)).sum(
            axis=1).to_frame(name="communality")
        redundancy = communality * r_squared_aux
        redundancy.columns = ["redundancy"]
        
        # Kết hợp các chỉ số thành bảng outer model
        self.__outer_model = pd.concat([weights, loading, communality, redundancy], axis=1, sort=True)

    def get_data(self, mvs):
        # Trả về data gốc cho các manifest variables
        try:
            return self.__data[mvs]
        except Exception:
            return pd.DataFrame()

    def model(self) -> pd.DataFrame:
        """
        Trả về bảng tổng hợp các chỉ số outer model cho từng manifest variable.
        """
        return self.__outer_model

    def crossloadings(self) -> pd.DataFrame:
        """
        Trả về ma trận crossloadings giữa manifest variable và latent variable.
        """
        return self.__crossloadings
