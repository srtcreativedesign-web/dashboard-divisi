<?php

namespace App\Services;

use Illuminate\Http\Request;
use RuntimeException;
use Throwable;

class MutationFileRollback
{
    public static function register(callable $compensate): void
    {
        $request = request();
        $actions = $request->attributes->get('mutation_file_rollback', []);
        $actions[] = $compensate;
        $request->attributes->set('mutation_file_rollback', $actions);
    }

    public static function run(Request $request): void
    {
        $failed = false;
        foreach (array_reverse($request->attributes->get('mutation_file_rollback', [])) as $action) {
            try {
                if ($action() === false) {
                    $failed = true;
                }
            } catch (Throwable) {
                $failed = true;
            }
        }
        $request->attributes->remove('mutation_file_rollback');
        if ($failed) {
            report(new RuntimeException('Kompensasi berkas mutasi gagal; perlu rekonsiliasi storage'));
        }
    }
}
