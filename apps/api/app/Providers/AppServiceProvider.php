<?php

namespace App\Providers;

use App\Services\Sobat\Contracts\SobatClientInterface;
use App\Services\SobatHrClientService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            SobatClientInterface::class,
            SobatHrClientService::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Anti brute-force per akun, bukan per IP: di balik proxy/NAT semua admin
        // berbagi satu IP sehingga limit IP memblokir login yang sah (429).
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(10)
            ->by(Str::lower((string) $request->input('email')).'|'.$request->ip()));

        RateLimiter::for('reset', fn (Request $request) => Limit::perMinute(10)
            ->by(($request->attributes->get('user')['sub'] ?? '').'|'.$request->ip()));
    }
}
