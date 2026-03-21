<?php

use App\Http\Controllers\AddressLookupController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeInvitationController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\KeepAliveController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\WhatsAppController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

// Employee invitation routes (no auth required)
Route::get('employee/invitation/{token}', [EmployeeInvitationController::class, 'showAcceptForm'])->name('employee.invitation.accept');
Route::post('employee/invitation/{token}', [EmployeeInvitationController::class, 'acceptInvitation'])->name('employee.invitation.submit');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('api/keep-alive', KeepAliveController::class)->name('keep-alive');
    Route::get('companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::post('companies', [CompanyController::class, 'store'])->name('companies.store');
    Route::post('companies/switch', [CompanyController::class, 'switch'])->name('companies.switch');
});

Route::middleware(['auth', 'verified', 'company'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
    Route::get('address-search', [AddressLookupController::class, 'index'])->name('address-search.index');
    Route::post('address-search/autocomplete', [AddressLookupController::class, 'autocomplete'])->name('address-search.autocomplete');
    Route::post('address-search/find-customers', [AddressLookupController::class, 'findCustomers'])->name('address-search.find-customers');
    Route::post('address-search/lookup', [AddressLookupController::class, 'lookup'])->name('address-search.lookup');
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('employees/create', [EmployeeController::class, 'create'])->name('employees.create');
    Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::get('employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
    Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('employees/{employee}/send-invitation', [EmployeeInvitationController::class, 'sendInvitation'])->name('employees.send-invitation');
    Route::get('jobs', [JobController::class, 'index'])->name('jobs.index');
    Route::get('jobs/create', [JobController::class, 'create'])->name('jobs.create');
    Route::post('jobs', [JobController::class, 'store'])->name('jobs.store');
    Route::get('jobs/{job}', [JobController::class, 'show'])->name('jobs.show');
    Route::get('jobs/{job}/edit', [JobController::class, 'edit'])->name('jobs.edit');
    Route::put('jobs/{job}', [JobController::class, 'update'])->name('jobs.update');
    Route::delete('jobs/{job}', [JobController::class, 'destroy'])->name('jobs.destroy');
    Route::post('jobs/{job}/mark-paid', [JobController::class, 'markPaid'])->name('jobs.mark-paid');
    Route::post('jobs/{job}/send-whatsapp', [JobController::class, 'sendWhatsApp'])->name('jobs.send-whatsapp');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('invoices/{invoice}/preview', [InvoiceController::class, 'preview'])->name('invoices.preview');
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
    Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::post('invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid'])->name('invoices.mark-paid');
    Route::post('invoices/{invoice}/send', [InvoiceController::class, 'send'])->name('invoices.send');
    Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/revenue-by-employee', [ReportController::class, 'revenueByEmployee'])->name('reports.revenue-by-employee');
    Route::get('reports/jobs-by-status', [ReportController::class, 'jobsByStatus'])->name('reports.jobs-by-status');
    Route::get('reports/monthly-revenue', [ReportController::class, 'monthlyRevenue'])->name('reports.monthly-revenue');
    Route::get('reports/customer-jobs', [ReportController::class, 'customerJobs'])->name('reports.customer-jobs');
    Route::get('reports/employee-performance', [ReportController::class, 'employeePerformance'])->name('reports.employee-performance');

    // WhatsApp Cloud API (per-company connect, send, status)
    Route::get('whatsapp/status', [WhatsAppController::class, 'status'])->name('whatsapp.status');
    Route::post('whatsapp/connect', [WhatsAppController::class, 'connect'])->name('whatsapp.connect');
    Route::post('whatsapp/disconnect', [WhatsAppController::class, 'disconnect'])->name('whatsapp.disconnect');
    Route::post('whatsapp/send', [WhatsAppController::class, 'send'])->name('whatsapp.send');
});

// WhatsApp webhook (no auth; Meta calls this)
Route::get('webhook/whatsapp', [WhatsAppController::class, 'webhookVerify'])->name('whatsapp.webhook.verify');
Route::post('webhook/whatsapp', [WhatsAppController::class, 'webhook'])->name('whatsapp.webhook');

require __DIR__.'/settings.php';
