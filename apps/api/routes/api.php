<?php

use App\Http\Controllers\Api\V1\AccAdminController;
use App\Http\Controllers\Api\V1\AccountingCashflowController;
use App\Http\Controllers\Api\V1\AccountingController;
use App\Http\Controllers\Api\V1\AccountingImportController;
use App\Http\Controllers\Api\V1\AccountingMasterController;
use App\Http\Controllers\Api\V1\AccountingOutstandingController;
use App\Http\Controllers\Api\V1\AccountingReconciliationController;
use App\Http\Controllers\Api\V1\AccountingTransactionController;
use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BodController;
use App\Http\Controllers\Api\V1\BudgetingController;
use App\Http\Controllers\Api\V1\DivisionConfigController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\OrgController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ProjectDocumentController;
use App\Http\Controllers\Api\V1\ProjectExpenseController;
use App\Http\Controllers\Api\V1\ProjectInvoiceController;
use App\Http\Controllers\Api\V1\ProjectPhotoController;
use App\Http\Controllers\Api\V1\ProjectRabController;
use App\Http\Controllers\Api\V1\ProjectReportController;
use App\Http\Controllers\Api\V1\ProjectVendorController;
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

            // Admin Accounting Remodeled Module Endpoints
            Route::prefix('acc-admin')->middleware(['scope', 'capability:view:acc_report'])->group(function () {
                Route::get('dashboard', [AccAdminController::class, 'dashboard']);
                Route::get('storan', [AccAdminController::class, 'getStoran']);
                Route::post('storan', [AccAdminController::class, 'saveStoran']);
                Route::get('cashless', [AccAdminController::class, 'getCashless']);
                Route::post('cashless', [AccAdminController::class, 'saveCashless']);
                Route::get('laundry', [AccAdminController::class, 'getLaundry']);
                Route::post('laundry', [AccAdminController::class, 'saveLaundry']);
                Route::get('stok', [AccAdminController::class, 'getStok']);
                Route::post('stok', [AccAdminController::class, 'saveStok']);
                Route::get('utilisasi', [AccAdminController::class, 'getUtilisasi']);
                Route::post('utilisasi', [AccAdminController::class, 'saveUtilisasi']);
                Route::get('komisi', [AccAdminController::class, 'getKomisi']);
                Route::post('komisi', [AccAdminController::class, 'hitungKomisi']);
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
        // Project Division
        Route::prefix('projects')->middleware(['scope', 'capability:view:projects'])->group(function () {
            Route::get('/', [ProjectController::class, 'index']);
            Route::get('/{id}', [ProjectController::class, 'show']);
            Route::get('/{id}/financial-summary', [ProjectController::class, 'financialSummary']);
            Route::get('/{id}/documents', [ProjectDocumentController::class, 'index']);
            Route::get('/{id}/photos', [ProjectPhotoController::class, 'index']);
            Route::get('/{id}/rab', [ProjectRabController::class, 'index']);
            Route::get('/{id}/expenses', [ProjectExpenseController::class, 'index']);
            Route::get('/{id}/invoices', [ProjectInvoiceController::class, 'index']);
            Route::get('/{id}/reports/progress', [ProjectReportController::class, 'progressReport']);
            Route::get('/{id}/reports/bast', [ProjectReportController::class, 'bastReport']);

            Route::middleware(['capability:manage:projects'])->group(function () {
                Route::post('/', [ProjectController::class, 'store']);
                Route::put('/{id}', [ProjectController::class, 'update']);
                Route::patch('/{id}/payment-toggle', [ProjectController::class, 'paymentToggle']);
                Route::post('/{id}/milestones', [ProjectController::class, 'storeMilestone']);
                Route::put('/{id}/milestones/{milestoneId}', [ProjectController::class, 'updateMilestone']);
                Route::delete('/{id}/milestones/{milestoneId}', [ProjectController::class, 'destroyMilestone']);

                Route::post('/{id}/rab', [ProjectRabController::class, 'store']);
                Route::put('/{id}/rab/{rabId}', [ProjectRabController::class, 'update']);
                Route::delete('/{id}/rab/{rabId}', [ProjectRabController::class, 'destroy']);

                Route::post('/{id}/expenses', [ProjectExpenseController::class, 'store']);
                Route::put('/{id}/expenses/{expenseId}', [ProjectExpenseController::class, 'update']);
                Route::delete('/{id}/expenses/{expenseId}', [ProjectExpenseController::class, 'destroy']);

                Route::post('/{id}/invoices', [ProjectInvoiceController::class, 'store']);
                Route::put('/{id}/invoices/{invoiceId}', [ProjectInvoiceController::class, 'update']);
                Route::patch('/{id}/invoices/{invoiceId}/pay', [ProjectInvoiceController::class, 'markPaid']);
                Route::delete('/{id}/invoices/{invoiceId}', [ProjectInvoiceController::class, 'destroy']);

                Route::post('/{id}/documents', [ProjectDocumentController::class, 'store']);
                Route::delete('/{projectId}/documents/{documentId}', [ProjectDocumentController::class, 'destroy']);

                Route::post('/{id}/photos', [ProjectPhotoController::class, 'store']);
                Route::delete('/{projectId}/photos/{photoId}', [ProjectPhotoController::class, 'destroy']);
            });
        });

        Route::prefix('vendors')->middleware(['scope', 'capability:view:projects'])->group(function () {
            Route::get('/', [ProjectVendorController::class, 'index']);
            Route::get('/{id}', [ProjectVendorController::class, 'show']);

            Route::middleware(['capability:manage:projects'])->group(function () {
                Route::post('/', [ProjectVendorController::class, 'store']);
                Route::put('/{id}', [ProjectVendorController::class, 'update']);
                Route::delete('/{id}', [ProjectVendorController::class, 'destroy']);
            });
        });

        // Admin Division Module (Modul 14 Tugas Admin)
        Route::prefix('admin')->middleware(['scope'])->group(function () {
            Route::middleware(['capability:view:leave_records'])->group(function () {
                Route::get('leaves', [AdminController::class, 'listLeaves']);
                Route::post('leaves', [AdminController::class, 'storeLeave']);
                Route::patch('leaves/{id}/status', [AdminController::class, 'updateLeaveStatus']);
            });

            Route::middleware(['capability:manage:attendance_realization'])->group(function () {
                Route::get('attendance-realizations', [AdminController::class, 'listAttendanceRealizations']);
                Route::post('attendance-realizations', [AdminController::class, 'storeAttendanceRealization']);
                Route::patch('attendance-realizations/{id}/status', [AdminController::class, 'updateAttendanceStatus']);
            });

            Route::middleware(['capability:write:purchase_voucher'])->group(function () {
                Route::post('vouchers', [AdminController::class, 'storeVoucher']);
            });
            Route::middleware(['capability:write:chair_audit'])->group(function () {
                Route::post('chair-usage-audits', [AdminController::class, 'storeChairAudit']);
                Route::post('therapist-revenues', [AdminController::class, 'storeTherapistRevenue']);
            });
            Route::middleware(['capability:write:finance_admin'])->group(function () {
                Route::get('stock-cards', [AdminController::class, 'listStockCards']);
                Route::post('stock-cards', [AdminController::class, 'storeStockCard']);
                Route::get('deposits', [AdminController::class, 'listDeposits']);
                Route::post('deposits', [AdminController::class, 'storeDeposit']);
                Route::get('cashless', [AdminController::class, 'listCashless']);
                Route::post('cashless', [AdminController::class, 'storeCashless']);
                Route::get('laundry', [AdminController::class, 'listLaundry']);
                Route::post('laundry', [AdminController::class, 'storeLaundry']);
                Route::get('pnl-support', [AdminController::class, 'getPnlSupport']);
                Route::get('bonus-records', [AdminController::class, 'listBonusRecords']);
                Route::post('bonus-records', [AdminController::class, 'storeBonusRecord']);
            });
        });
    });
});
