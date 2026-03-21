<?php

use App\Http\Controllers\Settings\JobTypeController;
use App\Http\Controllers\Settings\LocaleController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/locale', function () {
        return Inertia::render('settings/locale');
    })->name('locale.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    Route::get('settings/integrations', function () {
        return Inertia::render('settings/integrations');
    })->middleware('company')->name('integrations.edit');

    Route::get('settings/integrations/connect-whatsapp-guide', function () {
        return Inertia::render('settings/connect-whatsapp-guide');
    })->middleware('company')->name('integrations.connect-whatsapp-guide');

    Route::get('settings/job-types', [JobTypeController::class, 'index'])->middleware('company')->name('settings.job-types.index');
    Route::post('settings/job-types', [JobTypeController::class, 'store'])->middleware('company')->name('settings.job-types.store');
    Route::put('settings/job-types/{jobType}', [JobTypeController::class, 'update'])->middleware('company')->name('settings.job-types.update');
    Route::delete('settings/job-types/{jobType}', [JobTypeController::class, 'destroy'])->middleware('company')->name('settings.job-types.destroy');

    Route::patch('settings/locale', [LocaleController::class, 'update'])->name('locale.update');
});
