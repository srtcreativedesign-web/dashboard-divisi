<?php

use App\Models\BudgetEntry;
use App\Models\RevenueDaily;

$revCount = RevenueDaily::count();
$budgetCount = BudgetEntry::count();
echo json_encode(['revCount' => $revCount, 'budgetCount' => $budgetCount]);
