import pandas as pd, statsmodels.api as sm

def _summary(dv, regression):
    # Hàm tổng hợp kết quả hồi quy cho một latent variable (dv)
    # Trả về DataFrame gồm các chỉ số: hệ số, std error, t, p-value, ...
    summary = pd.DataFrame(0, columns=['from', 'to', 'estimate', 'std error', 't', 'p>|t|'], index=regression.params.index)
    summary['to'] = dv
    summary['from'] = regression.params.index
    summary['estimate'] = regression.params
    summary['std error'] = regression.bse
    summary['t'] = regression.tvalues
    summary['p>|t|'] = regression.pvalues.round(3)    
    summary['index'] = summary['from'] + " -> " + summary['to']
    return summary.drop(['const']).reset_index(drop=True)


def _effects(path: pd.DataFrame):
    # Hàm tính hiệu ứng trực tiếp, gián tiếp, tổng cho từng cặp latent variable
    indirect_paths = pd.DataFrame(0, index=path.index, columns=path.columns)
    effects = pd.DataFrame({"from":     pd.Series(dtype="str"),
                            "to":       pd.Series(dtype="str"),
                            "direct":   pd.Series(dtype="float"),
                            "indirect": pd.Series(dtype="float"),
                            "total":    pd.Series(dtype="float")})
    num_lvs = len(list(path))
    if (num_lvs == 2):
        total_paths = path
    else:
        path_effects = {}
        path_effects[0] = path
        for i in range(1, num_lvs):
            path_effects[i] = path_effects[i - 1].dot(path)
            indirect_paths = indirect_paths + path_effects[i]
        total_paths = path + indirect_paths
    for from_lv in list(path):
        for to_lv in list(path):
            if from_lv != to_lv and total_paths.loc[to_lv, from_lv] != 0:
                effect = pd.DataFrame([{
                        "from": from_lv,
                        "to": to_lv,
                        "direct": path.loc[to_lv, from_lv],
                        "indirect": indirect_paths.loc[to_lv, from_lv],
                        "total": total_paths.loc[to_lv, from_lv]
                    }], index=[from_lv + " -> " + to_lv])
                effects = pd.concat([effects, effect])
    return effects


class InnerModel:
    """
    Class tính toán các chỉ số của inner model (mô hình bên trong):
    - Tính hệ số đường dẫn giữa các latent variable
    - Tính R², R² điều chỉnh cho từng latent variable
    - Tính hiệu ứng trực tiếp, gián tiếp, tổng
    """
    def __init__(self, path: pd.DataFrame, scores: pd.DataFrame):
        self.__summaries = None
        self.__r_squared = pd.Series(0.0, index=path.index, name="r_squared")
        self.__r_squared_adj = pd.Series(0.0, index=path.index, name="r_squared_adj")
        self.__path_coefficients = pd.DataFrame(0.0, columns=path.columns, index=path.index)
        endogenous = path.sum(axis=1).astype(bool)
        self.__endogenous = list(endogenous[endogenous == True].index)
        rows = scores.shape[0]
        # Tính toán cho từng latent variable endogenous
        for dv in self.__endogenous:
            ivs = path.loc[dv,][path.loc[dv,] == 1].index
            exogenous = sm.add_constant(scores.loc[:, ivs])
            regression = sm.OLS(scores.loc[:, dv], exogenous).fit()
            self.__path_coefficients.loc[dv, ivs] = regression.params
            rsquared = regression.rsquared
            self.__r_squared.loc[dv] = rsquared
            self.__r_squared_adj.loc[dv] = 1 - (1 - rsquared) * (rows - 1) / (rows - path.loc[dv].sum() - 1)
            self.__summaries = pd.concat([self.__summaries, _summary(dv, regression)]).reset_index(drop=True)
        # Tính hiệu ứng trực tiếp, gián tiếp, tổng cho từng cặp latent variable
        self.__effects = _effects(self.__path_coefficients)

    def path_coefficients(self) -> pd.DataFrame:
        """
        Trả về ma trận hệ số đường dẫn giữa các latent variable.
        """
        return self.__path_coefficients

    def r_squared(self) -> pd.Series:
        """
        Trả về chỉ số R² cho từng latent variable.
        """
        return self.__r_squared

    def r_squared_adj(self) -> pd.Series:
        """
        Trả về chỉ số R² điều chỉnh cho từng latent variable.
        """
        return self.__r_squared_adj

    def inner_model(self) -> pd.DataFrame:
        """
        Trả về bảng tổng hợp các chỉ số hồi quy cho từng latent variable.
        """
        return self.__summaries.set_index(['index'])

    def effects(self) -> pd.DataFrame:
        """
        Trả về bảng hiệu ứng trực tiếp, gián tiếp, tổng cho từng cặp latent variable.
        """
        return self.__effects

    def endogenous(self) -> list:
        """
        Trả về danh sách các latent variable endogenous (bị tác động).
        """
        return self.__endogenous
