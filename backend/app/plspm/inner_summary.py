import pandas as pd, numpy as np, math
from plspm.config import Config
from plspm.mode import Mode


class InnerSummary:
    # Lớp này tổng hợp các chỉ số của inner model (mô hình bên trong) cho từng latent variable

    def __init__(self, config: Config, r_squared: pd.Series, r_squared_adj: pd.Series, outer_model: pd.DataFrame):
        # Khởi tạo với config, chỉ số R², R² điều chỉnh và outer_model (bảng đặc trưng bên ngoài)
        path = config.path()  # Ma trận đường dẫn giữa các latent variable

        # Xác định loại latent variable: Exogenous (không bị tác động) hay Endogenous (bị tác động)
        lv_type = path.sum(axis=1).astype(bool)
        lv_type.name = "type"
        lv_type_text = lv_type.replace(False, "Exogenous").replace(True, "Endogenous")

        # Khởi tạo các Series để lưu các chỉ số cho từng latent variable
        block_communality = pd.Series(np.nan, index=path.index, name="block_communality")
        mean_redundancy = pd.Series(np.nan, index=path.index, name="mean_redundancy")
        ave = pd.Series(np.nan, index=path.index, name="ave")
        communality_aux = []  # Lưu các giá trị cộng đồng để tính goodness-of-fit
        num_mvs_in_lv = []    # Lưu số lượng manifest variables của từng latent variable
        
        # Tính toán các chỉ số cho từng latent variable
        for lv in list(config.path()):
            
            # Lấy các chỉ số cộng đồng cho các manifest variables thuộc latent variable lv
            communality = outer_model.loc[:, "communality"].loc[config.mvs(lv)]
            block_communality.loc[lv] = communality.mean()  # Độ cộng đồng khối
            mean_redundancy.loc[lv] = outer_model.loc[:, "redundancy"].loc[config.mvs(lv)].mean()  # Độ dư thừa trung bình
            
            # Nếu là mode A thì tính AVE (Average Variance Extracted)
            if config.mode(lv) == Mode.A:
                ave_numerator = communality.sum()
                ave_denominator = ave_numerator + (1 - communality).sum()
                ave.loc[lv] = ave_numerator / ave_denominator
            
            # Lưu lại số lượng manifest variables và cộng đồng để tính goodness-of-fit
            if len(config.mvs(lv)) > 1:
                num_mvs_in_lv.append(len(config.mvs(lv)))
                communality_aux.append(block_communality.loc[lv])
        
        # Ghép tất cả các chỉ số thành một bảng tổng hợp (summary) cho từng latent variable
        self.__summary = pd.concat([
            lv_type_text,         # Loại latent variable
            r_squared,            # R squared
            r_squared_adj,        # R squared điều chỉnh
            block_communality,    # Độ cộng đồng khối
            mean_redundancy,      # Độ dư thừa trung bình
            ave                   # AVE
        ], axis=1, sort=True)
        
        # Tính goodness-of-fit cho mô hình nếu có nhiều hơn 1 manifest variable
        if sum(num_mvs_in_lv) > 0:
            
            # Trung bình cộng đồng có trọng số số lượng manifest variables
            mean_communality = sum(x * y for x, y in zip(communality_aux, num_mvs_in_lv)) / sum(num_mvs_in_lv)
            r_squared_aux = r_squared * lv_type  # Chỉ lấy R² của endogenous
            
            # Goodness-of-fit là căn bậc hai của tích mean_communality và trung bình R²
            self.__goodness_of_fit = np.sqrt(mean_communality * r_squared_aux[r_squared_aux != 0].mean())
        else:
            
            # Nếu tất cả đều là single-item thì không tính được goodness-of-fit
            self.__goodness_of_fit = float("NaN")

    def summary(self) -> pd.DataFrame:
        """
        Trả về bảng tổng hợp các chỉ số của inner model cho từng latent variable.
        """
        return self.__summary

    def goodness_of_fit(self) -> float:
        """
        Trả về chỉ số goodness-of-fit của mô hình (nếu tính được).
        Nếu tất cả các khối đều là single-item thì sẽ báo lỗi.
        """
        if math.isnan(self.__goodness_of_fit):
            raise ValueError("Cannot calculate goodness-of-fit if all constructs are single-item.")
        return self.__goodness_of_fit
