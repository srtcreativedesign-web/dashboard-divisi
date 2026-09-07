<?php

use App\Http\Controllers\Api\V1\AccountingCashflowController;
use App\Http\Controllers\Api\V1\AccountingController;
use App\Http\Controllers\Api\V1\AccountingImportController;
use App\Http\Controllers\Api\V1\AccountingMasterController;
use App\Http\Controllers\Api\V1\AccountingOutstandingController;
use App\Http\Controllers\Api\V1\AccountingReconciliationController;
use App\Http\Controllers\Api\V1\AccountingTransactionController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BodController;
use App\Http\Controllers\Api\V1\BudgetingController;
use App\Http\Controllers\Api\V1\DivisionConfigController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\OrgController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\RevenueController;
use App\Http\Controllers\Api\V1\SobatHrController;
use App\Http\Controllers\Api\V1\TargetController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Health check (public)
    Route::get('health', [HealthController::class, 'check']);

    // Auth public — rate limit 10/menit per email+IP (anti brute-force, lihat AppServiceProvider)
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    // Protected routes requiring JWT authentication
    Route::middleware(['jwt.auth'])->group(function () {
        // Auth session
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/reset', [AuthController::class, 'reset'])->middleware('throttle:reset');

        // Sobat API Integration (protected by capability & scope)
        Route::middleware(['capability:view:report'])->group(function () {
            Route::get('sobathr/status', [SobatHrController::class, 'status']);
        });
        Route::middleware(['scope', 'capability:write:revenue'])->group(function () {
            Route::post('sobathr/sync-tenants', [SobatHrController::class, 'syncTenants']);
        });

        // Org read models
        Route::get('org/divisions', [OrgController::class, 'divisions']);
        Route::get('org/outlets', [OrgController::class, 'outlets']);
        Route::get('org/assignments', [OrgController::class, 'assignments']);
        Route::get('org/me/context', [OrgController::class, 'context']);

        // BOD & Executive reporting
        Route::middleware(['capability:view:report'])->group(function () {
            Route::get('bod/executive-read-model', [BodController::class, 'executiveReadModel']);
            Route::get('bod/kpi-compatibility', [BodController::class, 'checkCompatibility']);
            Route::get('bod/overview', [BodController::class, 'overview']);
            Route::get('bod/pnl-comparison', [BodController::class, 'pnlComparison']);
            Route::get('division-configs', [DivisionConfigController::class, 'getAll']);
        });

        // Division configs — read/write per divisi memakai scope middleware (anti IDOR lintas divisi).
        Route::middleware(['scope'])->group(function () {
            Route::get('division-configs/{divisionCode}', [DivisionConfigController::class, 'getOne']);

            Route::middleware(['capability:manage:division'])->group(function () {
                Route::post('division-configs/{divisionCode}', [DivisionConfigController::class, 'upsert']);
            });
        });

        // Omzet, target, laporan & budgeting — scope divisi diperiksa dua lapis:
        // ScopeMiddleware untuk divisionCode eksplisit + DivisionScope pada model.
        Route::middleware(['scope'])->group(function () {
            Route::middleware(['capability:view:report'])->group(function () {
                Route::get('revenue/daily', [RevenueController::class, 'daily']);
                Route::get('revenue/mtd', [RevenueController::class, 'mtd']);
                Route::get('revenue/tenants', [RevenueController::class, 'tenants']);

                Route::get('targets/current-month', [TargetController::class, 'currentMonth']);
                Route::get('targets/run-rate', [TargetController::class, 'runRate']);

                Route::get('reports/transactions', [ReportController::class, 'transactions']);
                Route::get('reports/reconciliation', [ReportController::class, 'reconciliation']);

                Route::get('budgeting/cashflow', [BudgetingController::class, 'cashflow']);
                Route::get('budgeting/pnl', [BudgetingController::class, 'pnl']);
            });

            Route::middleware(['capability:write:revenue'])->group(function () {
                Route::post('revenue/daily', [RevenueController::class, 'storeDaily']);
                Route::post('revenue/batch-upload', [RevenueController::class, 'batchUpload']);
            });

            // Manager/Admin mengusulkan target...
            Route::middleware(['capability:write:target'])->group(function () {
                Route::post('targets/tenant', [TargetController::class, 'storeTenantTarget']);
            });

            // ...hanya BOD yang memutuskan (segregation of duties).
            Route::middleware(['capability:approve:target'])->group(function () {
                Route::post('targets/{id}/approve', [TargetController::class, 'approve']);
                Route::post('targets/{id}/return', [TargetController::class, 'returnTarget']);
            });
        });

        // Accounting domain foundation (ISSUE-5 + ISSUE-6 Master Data)
        Route::prefix('accounting')->middleware(['scope'])->group(function () {
            // Status fondasi dan laporan ACC — BOD, Manager ACC, Admin ACC
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('status', [AccountingController::class, 'status']);
                Route::get('reports', [AccountingController::class, 'reports']);
            });

            // Mutasi transaksi jurnal aktual ACC — hanya Admin ACC
            Route::middleware(['capability:write:acc_transaction'])->group(function () {
                Route::post('transactions', [AccountingController::class, 'storeTransaction']);
            });

            // Persetujuan / kontrol periode ACC — hanya Manager ACC
            Route::middleware(['capability:approve:acc_period'])->group(function () {
                Route::post('periods/approve', [AccountingController::class, 'approvePeriod']);
            });

            // Master Data ACC — ISSUE-6
            // Periode Accounting
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('periods', [AccountingMasterController::class, 'listPeriods']);
                Route::get('periods/{id}', [AccountingMasterController::class, 'getPeriod']);
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('periods', [AccountingMasterController::class, 'createPeriod']);
            });
            Route::middleware(['capability:submit:acc_period|manage:acc_period'])->group(function () {
                Route::post('periods/{id}/transition', [AccountingMasterController::class, 'transitionPeriod']);
            });

            // Master Kategori
            Route::middleware(['capability:view:acc_master'])->group(function () {
                Route::get('categories', [AccountingMasterController::class, 'listCategories']);
                Route::get('categories/{id}', [AccountingMasterController::class, 'getCategory']);
                Route::post('categories/resolve', [AccountingMasterController::class, 'resolveCategory']);
            });
            Route::middleware(['capability:manage:acc_master'])->group(function () {
                Route::post('categories', [AccountingMasterController::class, 'createCategory']);
                Route::put('categories/{id}', [AccountingMasterController::class, 'updateCategory']);
                Route::post('categories/{id}/deactivate', [AccountingMasterController::class, 'deactivateCategory']);
                Route::post('categories/{id}/aliases', [AccountingMasterController::class, 'addCategoryAlias']);
                Route::delete('categories/{id}/aliases/{aliasCode}', [AccountingMasterController::class, 'removeCategoryAlias']);
            });

            // Master Rekening
            Route::middleware(['capability:view:acc_master'])->group(function () {
                Route::get('accounts', [AccountingMasterController::class, 'listAccounts']);
                Route::get('accounts/{id}', [AccountingMasterController::class, 'getAccount']);
            });
            Route::middleware(['capability:manage:acc_master'])->group(function () {
                Route::post('accounts', [AccountingMasterController::class, 'createAccount']);
                Route::put('accounts/{id}', [AccountingMasterController::class, 'updateAccount']);
                Route::post('accounts/{id}/deactivate', [AccountingMasterController::class, 'deactivateAccount']);
            });

            // Audit History Master Data
            Route::middleware(['capability:view:acc_master'])->group(function () {
                Route::get('master/history', [AccountingMasterController::class, 'listMasterHistory']);
            });

            // Transaksi Accounting (Budgeting MVP) — ISSUE-7
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('transactions', [AccountingTransactionController::class, 'list']);
                Route::get('transactions/summary', [AccountingTransactionController::class, 'summary']);
                Route::get('transactions/{id}', [AccountingTransactionController::class, 'get']);
                Route::get('transactions/{id}/attachments/{attachmentId}/download', [AccountingTransactionController::class, 'downloadAttachment']);
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('transactions', [AccountingTransactionController::class, 'create']);
                Route::put('transactions/{id}', [AccountingTransactionController::class, 'update']);
                Route::post('transactions/{id}/cancel', [AccountingTransactionController::class, 'cancel']);
                Route::post('transactions/{id}/attachments', [AccountingTransactionController::class, 'uploadAttachment']);
            });

            // Outstanding Accounting — ISSUE-9
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('outstandings', [AccountingOutstandingController::class, 'list']);
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('outstandings', [AccountingOutstandingController::class, 'create']);
                Route::post('outstandings/{id}/pay', [AccountingOutstandingController::class, 'recordPayment']);
                Route::post('outstandings/{id}/cancel', [AccountingOutstandingController::class, 'cancel']);
            });

            // Rekonsiliasi Bank & Kontrol Periode — ISSUE-11
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('reconciliations', [AccountingReconciliationController::class, 'list']);
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('reconciliations/submit', [AccountingReconciliationController::class, 'submitPeriod']);
            });
            Route::middleware(['capability:approve:acc_period'])->group(function () {
                Route::post('reconciliations/approve', [AccountingReconciliationController::class, 'approvePeriod']);
                Route::post('reconciliations/close', [AccountingReconciliationController::class, 'closePeriod']);
                Route::post('reconciliations/reopen', [AccountingReconciliationController::class, 'reopenPeriod']);
            });

            // Impor Transaksi Excel — ISSUE-8
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::post('import/preview', [AccountingImportController::class, 'preview']);
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('import/commit', [AccountingImportController::class, 'commit']);
            });

            // Laporan Cashflow — ISSUE-10
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('cashflow/report', [AccountingCashflowController::class, 'report']);
            });
        });
    });
});
