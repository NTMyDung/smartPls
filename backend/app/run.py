import pandas as pd
from plspm.config import Structure, Config
from plspm.mode import Mode
from plspm.scheme import Scheme
from plspm.plspm import Plspm
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd

if __name__ == "__main__":
   
    # Load data
    data = pd.read_csv("backend/app/Data_280.csv", index_col=0)

    # Define structure
    structure = Structure()
    structure.add_path(["VA"], ["FE", "PE"])
    structure.add_path(["MA"], ["FE", "PE"])
    structure.add_path(["GSA"], ["FE", "PE"])
    structure.add_path(["FE"], ["CE"])
    structure.add_path(["PE"], ["CE"])

    # Config
    config = Config(structure.path(), scaled=False)
    config.add_lv_with_columns_named("VA", Mode.A, data, "VA")
    config.add_lv_with_columns_named("MA", Mode.A, data, "MA")
    config.add_lv_with_columns_named("GSA", Mode.A, data, "GSA")
    config.add_lv_with_columns_named("FE", Mode.A, data, "FE")
    config.add_lv_with_columns_named("PE", Mode.A, data, "PE")
    config.add_lv_with_columns_named("CE", Mode.A, data, "CE")

    # Run PLS-PM
    pls = Plspm(data, config, Scheme.PATH, 300, 1e-7)

    print("Scores:\n", pls.scores())
    print("\nOuter Model:\n", pls.outer_model())
    print("\nInner Model:\n", pls.inner_model())
    print("\nPath Coefficients:\n", pls.path_coefficients())
    # print("\nCrossloadings:\n", pls.crossloadings())
    # print("\nInner Summary:\n", pls.inner_summary())
    # print("\nGoodness of Fit:", pls.goodness_of_fit())
    # print("\nEffects:\n", pls.effects())
    # print("\nUnidimensionality:\n", pls.unidimensionality())

    # In ra kết quả HTMT, Fornell-Larcker, VIF
    # print("\nOuter VIF:\n", pls.outer_vif())
    # print("\nInner VIF:\n", pls.inner_vif())
    print("\nHTMT matrix:\n", pls.htmt())
    # print("\nFornell-Larcker matrix:\n", pls.fornell_larcker())
    # print("\nF2:\n", pls.f2())


    # Khởi tạo DataFrame
    # pval = pd.DataFrame({
    #     'target': [
    #         # --- Latent to Latent ---
    #         'FE', 'FE', 'FE', 'PE', 'PE', 'CE', 'CE', 'PE',
            
    #         # --- Indicator của VA ---
    #         'VA1', 'VA2', 'VA3', 'VA4',
            
    #         # --- Indicator của MA ---
    #         'MA1', 'MA2', 'MA3', 'MA4', 'MA5',
            
    #         # --- Indicator của GSA ---
    #         'GSA1', 'GSA2', 'GSA3', 'GSA4',
            
    #         # --- Indicator của FE ---
    #         'FE1', 'FE2', 'FE3',
            
    #         # --- Indicator của PE ---
    #         'PE1', 'PE2', 'PE3',
            
    #         # --- Indicator của CE ---
    #         'CE1', 'CE2', 'CE3', 'CE4', 'CE5', 'CE6', 'CE7', 'CE8',
    #     ],
    #     'source': [
    #         # --- Latent to Latent ---
    #         'VA', 'MA', 'GSA', 'MA', 'GSA', 'FE', 'PE', 'VA',
            
    #         # --- Indicator của VA ---
    #         'VA', 'VA', 'VA', 'VA',
            
    #         # --- Indicator của MA ---
    #         'MA', 'MA', 'MA', 'MA', 'MA',
            
    #         # --- Indicator của GSA ---
    #         'GSA', 'GSA', 'GSA', 'GSA',
            
    #         # --- Indicator của FE ---
    #         'FE', 'FE', 'FE',
            
    #         # --- Indicator của PE ---
    #         'PE', 'PE', 'PE',
            
    #         # --- Indicator của CE ---
    #         'CE', 'CE', 'CE', 'CE', 'CE', 'CE', 'CE', 'CE',
    #     ],
    #     'p_value': [
    #         # --- Latent to Latent ---
    #         0.134, 0.304, 0.005, 0.002, 0.035, 0.252, 0.001, 0.081, 
            
    #         # --- Indicator của VA ---
    #         0.000, 0.000, 0.000, 0.000,
            
    #         # --- Indicator của MA ---
    #         0.000, 0.000, 0.000, 0.000, 0.000,
            
    #         # --- Indicator của GSA ---
    #         0.000, 0.000, 0.000, 0.000,
            
    #         # --- Indicator của FE ---
    #         0.000, 0.000, 0.000,
            
    #         # --- Indicator của PE ---
    #         0.000, 0.000, 0.000,
            
    #         # --- Indicator của CE ---
    #         0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000, 0.000
    #     ]
    # })
    # multi_index = pd.MultiIndex.from_arrays([pval['target'], pval['source']], names=['target', 'source'])
    # # Tạo Series với MultiIndex
    # pvals = pd.Series(pval['p_value'].values, index=multi_index, name='p_t')

    num_proc = os.cpu_count() #or 4
    # Tìm số process phù hợp nhất nhỏ hơn hoặc bằng số core
    for p in range(num_proc, 0, -1):
        if 5000 % p == 0:
            num_proc = p
            break

    pls_boot = Plspm(data, config, Scheme.PATH, 300, 1e-7, bootstrap=True, bootstrap_iterations=5000, processes=num_proc)
    boot = pls_boot.bootstrap()
    print("\nBootstrap Paths:\n", boot.paths())
    print("\nBootstrap Loadings:\n", boot.loading())

    # Lưu cột p_t từ bootstrap paths và loading, gộp lại thành MultiIndex
    boot_paths = boot.paths()
    boot_loadings = boot.loading()
    pvals = None
    pvals_list = []
    # Lấy p_t cho path (giữa latent variables)
    if isinstance(boot_paths, pd.DataFrame) and 'p_t' in boot_paths.columns:
        if isinstance(boot_paths.index, pd.MultiIndex):
            pvals_list.append(boot_paths['p_t'])
        else:
            # index là dạng 'SOURCE -> TARGET', cần tách source và target
            for idx in boot_paths.index:
                pval = boot_paths.loc[idx, 'p_t']
                # Tách source và target từ chuỗi, ví dụ 'AVP -> ATT'
                if '->' in idx:
                    source, target = [s.strip() for s in idx.split('->')]
                    mi = pd.MultiIndex.from_tuples([(target, source)], names=["target", "source"])
                    pvals_list.append(pd.Series([pval], index=mi))

    # Lấy p_t cho loading (giữa LV và MV)
    if isinstance(boot_loadings, pd.DataFrame) and 'p_t' in boot_loadings.columns:
        # index là MV, cần biết LV nào
        for mv in boot_loadings.index:
            pval = boot_loadings.loc[mv, 'p_t']
            # Tìm LV chứa MV này
            for lv in pls._get_all_lvs():
                if mv in pls._get_mvs(lv):
                    idx = pd.MultiIndex.from_tuples([(mv, lv)], names=["target", "source"])
                    pvals_list.append(pd.Series([pval], index=idx))
    # Gộp lại thành một Series MultiIndex nếu có
    if pvals_list:
        pvals = pd.concat(pvals_list)
    else:
        pvals = None

    # Vẽ biểu đồ với p-value bootstrap, truyền thêm boot_loadings để lấy loading bootstrap
    pls.plot_smartpls_diagram(pvals=pvals)


    