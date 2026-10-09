<?php

use App\Http\Controllers\Api\V1\Accounting\AccountingCashflowController;
use App\Http\Controllers\Api\V1\Accounting\AccountingController;
use App\Http\Controllers\Api\V1\Accounting\AccountingDashboardController;
use App\Http\Controllers\Api\V1\Accounting\AccountingImportController;
use App\Http\Controllers\Api\V1\Accounting\AccountingMasterController;
use App\Http\Controllers\Api\V1\Accounting\AccountingOutstandingController;
use App\Http\Controllers\Api\V1\Accounting\AccountingReconciliationController;
use App\Http\Controllers\Api\V1\Accounting\AccountingTransactionController;
use App\Http\Controllers\Api\V1\Accounting\CellularPreviewController;
use App\Http\Controllers\Api\V1\Accounting\DepositController;
use App\Http\Controllers\Api\V1\Accounting\HrRecapController;
use App\Http\Controllers\Api\V1\Accounting\InventoryController;
use App\Http\Controllers\Api\V1\Accounting\OmzetController;
use App\Http\Controllers\Api\V1\Accounting\VoucherController;
use App\Http\Controllers\Api\V1\Accounting\VoucherPaymentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BodController;
use App\Http\Controllers\Api\V1\Cellular\CellularController;
use App\Http\Controllers\Api\V1\Cellular\ManualWorkflowController;
use App\Http\Controllers\Api\V1\Cellular\DailyClosingController;
use App\Http\Controllers\Api\V1\DivisionConfigController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\OrgController;
use App\Http\Controllers\Api\V1\Project\ProjectController;
use App\Http\Controllers\Api\V1\Project\ProjectDocumentController;
use App\Http\Controllers\Api\V1\Project\ProjectExpenseController;
use App\Http\Controllers\Api\V1\Project\ProjectInvoiceController;
use App\Http\Controllers\Api\V1\Project\ProjectPettyCashController;
use App\Http\Controllers\Api\V1\Project\ProjectRabController;
use App\Http\Controllers\Api\V1\Project\ProjectVendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Health check (public)
    Route::get('health', [HealthController::class, 'check']);

    // Auth public — rate limit 10/menit per email+IP (anti brute-force, lihat AppServiceProvider)
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    // Protected routes requiring JWT authentication
    Route::middleware(['jwt.auth', 'critical.audit'])->group(function () {
        // Auth session
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/reset', [AuthController::class, 'reset'])->middleware('throttle:reset');

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
            Route::get('division-configs', [DivisionConfigController::class, 'getAll']);
        });

        // Division configs
        Route::middleware(['scope'])->group(function () {
            Route::get('division-configs/{divisionCode}', [DivisionConfigController::class, 'getOne']);

            Route::middleware(['capability:manage:division'])->group(function () {
                Route::post('division-configs/{divisionCode}', [DivisionConfigController::class, 'upsert']);
            });
        });

        // Accounting domain
        Route::prefix('accounting')->middleware(['scope'])->group(function () {
            Route::post('cellular-preview', [CellularPreviewController::class, 'preview'])->middleware(['capability:preview:cellular_report', 'throttle:10,1', 'file.scan']);
            Route::get('cellular-imports', [CellularPreviewController::class, 'index'])->middleware('capability:preview:cellular_report');
            Route::get('cellular-imports/{id}', [CellularPreviewController::class, 'show'])->whereUuid('id')->middleware('capability:preview:cellular_report');
            Route::post('cellular-imports/commit', [CellularPreviewController::class, 'commit'])->middleware('capability:write:omzet');
            Route::get('dashboard/operations', [AccountingDashboardController::class, 'operations'])->middleware('capability:view:acc_detail');
            Route::prefix('inventory')->middleware('capability:view:inventory')->group(function () {
                Route::get('catalog', [InventoryController::class, 'catalog']);
                Route::post('items', [InventoryController::class, 'item'])->middleware('capability:write:inventory');
                Route::post('locations', [InventoryController::class, 'location'])->middleware('capability:write:inventory');
                Route::get('documents', [InventoryController::class, 'documents']);
                Route::post('documents', [InventoryController::class, 'store'])->middleware('capability:write:inventory');
                Route::put('documents/{id}', [InventoryController::class, 'update'])->whereUuid('id')->middleware('capability:write:inventory');
                Route::post('documents/{id}/{action}', [InventoryController::class, 'transition'])->whereUuid('id')->whereIn('action', ['submit', 'approve', 'correction']);
            });
            Route::prefix('deposits')->middleware('capability:view:acc_deposits')->group(function () {
                Route::get('sources', [DepositController::class, 'sources']);
                Route::get('reconciliation', [DepositController::class, 'reconciliation']);
                Route::get('/', [DepositController::class, 'index']);
                Route::get('{id}', [DepositController::class, 'show'])->whereUuid('id');
                Route::post('/', [DepositController::class, 'store'])->middleware('capability:write:acc_deposits');
                Route::post('{id}/receive', [DepositController::class, 'receive'])->whereUuid('id')->middleware('capability:receive:acc_deposits');
                Route::post('{id}/void', [DepositController::class, 'void'])->whereUuid('id');
                Route::post('{id}/receipts/{receiptId}/void', [DepositController::class, 'voidReceipt'])->whereUuid('id')->whereUuid('receiptId');
            });
            Route::prefix('hr')->middleware('capability:view:acc_hr')->group(function () {
                Route::get('employees', [HrRecapController::class, 'employees']);
                Route::post('employees', [HrRecapController::class, 'createEmployee'])->middleware('capability:manage:acc_employees');
                Route::get('recaps', [HrRecapController::class, 'index']);
                Route::get('recaps/{id}', [HrRecapController::class, 'show'])->whereUuid('id');
                Route::post('recaps', [HrRecapController::class, 'store'])->middleware('capability:write:acc_hr');
                Route::put('recaps/{id}', [HrRecapController::class, 'update'])->whereUuid('id')->middleware('capability:write:acc_hr');
                Route::post('recaps/{id}/void', [HrRecapController::class, 'void'])->whereUuid('id')->middleware('capability:write:acc_hr');
            });
            Route::prefix('vouchers')->middleware('capability:view:acc_detail')->group(function () {
                Route::post('{id}/payments', [VoucherPaymentController::class, 'store'])->whereUuid('id')->middleware(['capability:execute:payment', 'file.scan']);
                Route::post('{id}/payments/{paymentId}/void', [VoucherPaymentController::class, 'void'])->whereUuid(['id', 'paymentId'])->middleware('capability:approve:voucher');
                Route::get('{id}/payments/{paymentId}/download', [VoucherPaymentController::class, 'download'])->whereUuid(['id', 'paymentId']);
                Route::get('outlets', [VoucherController::class, 'outlets']);
                Route::get('/', [VoucherController::class, 'index']);
                Route::get('{id}', [VoucherController::class, 'show'])->whereUuid('id');
                Route::post('{id}/attachments', [VoucherController::class, 'uploadAttachment'])->whereUuid('id')->middleware(['capability:attach:voucher', 'file.scan']);
                Route::get('{id}/attachments/{attachmentId}/download', [VoucherController::class, 'downloadAttachment'])->whereUuid('id')->whereUuid('attachmentId');
                Route::post('/', [VoucherController::class, 'store'])->middleware('capability:write:voucher');
                Route::put('{id}', [VoucherController::class, 'update'])->whereUuid('id')->middleware('capability:write:voucher');
                foreach (['submit' => 'write:voucher', 'review' => 'validate:voucher', 'decide' => 'approve:voucher'] as $action => $capability) {
                    Route::post('{id}/'.$action, [VoucherController::class, 'action'])->whereUuid('id')->defaults('action', $action)->middleware('capability:'.$capability);
                }
            });

            Route::prefix('omzet')->middleware('capability:view:acc_detail')->group(function () {
                Route::get('annual', [OmzetController::class, 'annual']);
                Route::get('outlets', [OmzetController::class, 'outlets']);
                Route::get('/', [OmzetController::class, 'index']);
                Route::get('{id}', [OmzetController::class, 'show']);
                Route::post('/', [OmzetController::class, 'store'])->middleware('capability:write:omzet');
                Route::put('{id}', [OmzetController::class, 'update'])->middleware('capability:write:omzet');
                foreach (['submit', 'request-unlock'] as $action) {
                    Route::post('{id}/'.$action, [OmzetController::class, 'action'])->defaults('action', $action)->middleware('capability:write:omzet');
                }
                Route::post('{id}/review', [OmzetController::class, 'action'])->defaults('action', 'review')->middleware('capability:validate:omzet');
                Route::post('{id}/decide', [OmzetController::class, 'action'])->defaults('action', 'decide')->middleware('capability:approve:omzet');
                Route::post('{id}/decide-unlock', [OmzetController::class, 'action'])->defaults('action', 'decide-unlock')->middleware('capability:manage:omzet_unlock');
            });

            // Status fondasi dan laporan ACC — BOD, Manager ACC, Admin ACC
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('status', [AccountingController::class, 'status']);
                Route::get('reports', [AccountingController::class, 'reports']);
            });

            // Persetujuan / kontrol periode ACC — hanya Manager ACC
            Route::middleware(['capability:approve:acc_period'])->group(function () {
                Route::post('periods/approve', [AccountingController::class, 'approvePeriod']);
            });

            // Periode Accounting
            Route::middleware(['capability:view:acc_report'])->group(function () {
                Route::get('periods', [AccountingMasterController::class, 'listPeriods']);
                Route::get('periods/{id}', [AccountingMasterController::class, 'getPeriod'])->middleware('capability:view:acc_detail');
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

            // Transaksi Accounting
            Route::middleware(['capability:view:acc_journal'])->group(function () {
                Route::get('transactions', [AccountingTransactionController::class, 'list']);
                Route::get('transactions/summary', [AccountingTransactionController::class, 'summary']);
                Route::get('transactions/{id}', [AccountingTransactionController::class, 'get']);
                Route::get('transactions/{id}/attachments/{attachmentId}/download', [AccountingTransactionController::class, 'downloadAttachment']);
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('transactions', [AccountingTransactionController::class, 'create']);
                Route::put('transactions/{id}', [AccountingTransactionController::class, 'update']);
                Route::post('transactions/{id}/cancel', [AccountingTransactionController::class, 'cancel']);
                Route::post('transactions/{id}/attachments', [AccountingTransactionController::class, 'uploadAttachment'])->middleware('file.scan');
            });

            // Outstanding Accounting
            Route::middleware(['capability:view:acc_detail'])->group(function () {
                Route::get('outstandings', [AccountingOutstandingController::class, 'list']);
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('outstandings', [AccountingOutstandingController::class, 'create']);
                Route::post('outstandings/{id}/pay', [AccountingOutstandingController::class, 'recordPayment']);
                Route::post('outstandings/{id}/cancel', [AccountingOutstandingController::class, 'cancel']);
            });

            // Rekonsiliasi Bank
            Route::middleware(['capability:view:acc_detail'])->group(function () {
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

            // Impor Transaksi Excel
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('import/preview', [AccountingImportController::class, 'preview'])->middleware('file.scan');
            });
            Route::middleware(['capability:submit:acc_period'])->group(function () {
                Route::post('import/commit', [AccountingImportController::class, 'commit']);
            });

            Route::get('cashflow/summary', [AccountingCashflowController::class, 'summary'])->middleware('capability:view:acc_report');

            // Laporan Cashflow
            Route::middleware(['capability:view:acc_detail'])->group(function () {
                Route::get('cashflow/report', [AccountingCashflowController::class, 'report']);
            });
        });

        // Project Division
        Route::prefix('projects')->middleware(['scope', 'capability:view:projects'])->group(function () {
            Route::get('/', [ProjectController::class, 'index']);
            Route::get('/{id}', [ProjectController::class, 'show']);
            Route::get('/{id}/financial-summary', [ProjectController::class, 'financialSummary']);
            Route::get('/{id}/documents', [ProjectDocumentController::class, 'index']);
            Route::get('/{projectId}/documents/{documentId}/download', [ProjectDocumentController::class, 'download']);
            Route::get('/{projectId}/petty-cash', [ProjectPettyCashController::class, 'index']);
            Route::get('/{projectId}/petty-cash/{id}/download', [ProjectPettyCashController::class, 'downloadReceipt']);
            Route::get('/{projectId}/invoices', [ProjectInvoiceController::class, 'index']);
            Route::get('/{projectId}/expenses', [ProjectExpenseController::class, 'index']);
            Route::get('/{projectId}/rab', [ProjectRabController::class, 'index']);

            Route::middleware(['capability:manage:projects'])->group(function () {
                Route::post('/', [ProjectController::class, 'store']);
                Route::put('/{id}', [ProjectController::class, 'update']);
                Route::delete('/{id}', [ProjectController::class, 'destroy']);
                Route::patch('/{id}/payment-toggle', [ProjectController::class, 'paymentToggle']);
                Route::post('/{id}/milestones', [ProjectController::class, 'storeMilestone']);
                Route::put('/{projectId}/milestones/{milestoneId}', [ProjectController::class, 'updateMilestone']);
                Route::post('/{id}/milestones/ensure-standard', [ProjectController::class, 'syncStandardMilestones']);
                Route::post('/{id}/rab', [ProjectRabController::class, 'store']);
                Route::put('/{projectId}/rab/batch', [ProjectRabController::class, 'batchSync']);
                Route::put('/{projectId}/rab/{rabId}', [ProjectRabController::class, 'update']);
                Route::delete('/{projectId}/rab/{rabId}', [ProjectRabController::class, 'destroy']);

                Route::post('/{id}/documents', [ProjectDocumentController::class, 'store'])->middleware('file.scan');
                Route::delete('/{projectId}/documents/{documentId}', [ProjectDocumentController::class, 'destroy']);

                Route::post('/{projectId}/petty-cash', [ProjectPettyCashController::class, 'store'])->middleware('file.scan');
                Route::put('/{projectId}/petty-cash/{id}', [ProjectPettyCashController::class, 'update'])->middleware('file.scan');
                Route::delete('/{projectId}/petty-cash/{id}', [ProjectPettyCashController::class, 'destroy']);

                Route::post('/{projectId}/invoices', [ProjectInvoiceController::class, 'store']);
                Route::put('/{projectId}/invoices/{invoiceId}', [ProjectInvoiceController::class, 'update']);
                Route::patch('/{projectId}/invoices/{invoiceId}/pay', [ProjectInvoiceController::class, 'markPaid']);
                Route::delete('/{projectId}/invoices/{invoiceId}', [ProjectInvoiceController::class, 'destroy']);

                Route::post('/{projectId}/expenses', [ProjectExpenseController::class, 'store'])->middleware('file.scan');
                Route::put('/{projectId}/expenses/{expenseId}', [ProjectExpenseController::class, 'update'])->middleware('file.scan');
                Route::delete('/{projectId}/expenses/{expenseId}', [ProjectExpenseController::class, 'destroy']);
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

        Route::prefix('cellular')->middleware(['scope', 'capability:view:cellular'])->group(function () {
            Route::get('outlets', [CellularController::class, 'outlets']);
            Route::get('products', [ManualWorkflowController::class, 'products']);
            Route::post('products', [ManualWorkflowController::class, 'createProduct'])->middleware('capability:manage:cellular_catalog');
            Route::get('stock', [ManualWorkflowController::class, 'stock']);
            Route::get('movements', [ManualWorkflowController::class, 'movements']);
            Route::post('stock', [ManualWorkflowController::class, 'adjust'])->middleware('capability:write:cellular_stock');
            Route::get('sales', [ManualWorkflowController::class, 'sales'])->middleware('capability:view:cellular_sales');
            Route::post('sales', [ManualWorkflowController::class, 'sell'])->middleware('capability:write:cellular_sale');
            Route::post('sales/{id}/void', [ManualWorkflowController::class, 'void'])->whereUuid('id')->middleware('capability:void:cellular_sale');
            Route::get('daily-closings', [DailyClosingController::class, 'index'])->middleware('capability:view:cellular_daily');
            Route::post('daily-closings', [DailyClosingController::class, 'store'])->middleware('capability:write:cellular_daily');
            Route::post('daily-closings/{id}/{action}', [DailyClosingController::class, 'transition'])->whereUuid('id')->whereIn('action', ['submit', 'validate', 'approve', 'correction']);
        });
    });
});
