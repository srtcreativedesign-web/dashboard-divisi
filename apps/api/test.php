<?php
$revCount = \App\Models\RevenueDaily::count();
$budgetCount = \App\Models\BudgetEntry::count();
echo json_encode(['revCount' => $revCount, 'budgetCount' => $budgetCount]);
