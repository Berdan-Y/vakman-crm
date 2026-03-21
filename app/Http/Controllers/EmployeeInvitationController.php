<?php

namespace App\Http\Controllers;

use App\Mail\EmployeeInvitation;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeInvitationController extends Controller
{
    public function sendInvitation(Request $request, Employee $employee): RedirectResponse
    {
        $companyId = session('current_company_id');
        if ($employee->company_id !== $companyId) {
            abort(404);
        }

        // Check if user already exists
        $existingUser = User::where('email', $employee->email)->first();
        if ($existingUser) {
            return back()->with('error', __('A user account already exists for this email address.'));
        }

        // Check if employee already has a user account
        if ($employee->user_id) {
            return back()->with('error', __('This employee already has an account.'));
        }

        // Generate invitation token
        $token = Str::random(64);

        $employee->update([
            'invitation_token' => $token,
            'invitation_sent_at' => now(),
        ]);

        // Send invitation email
        $invitationUrl = route('employee.invitation.accept', ['token' => $token]);
        $companyName = $employee->company->name;

        try {
            Mail::to($employee->email)->send(new EmployeeInvitation($employee, $invitationUrl, $companyName));

            return back()->with('success', __('Invitation sent successfully to '.$employee->email));
        } catch (\Exception $e) {
            \Log::error('Failed to send employee invitation: '.$e->getMessage());

            return back()->with('error', __('Failed to send invitation email. Please check your mail configuration.'));
        }
    }

    public function showAcceptForm(string $token): Response|RedirectResponse
    {
        $employee = Employee::where('invitation_token', $token)
            ->whereNotNull('invitation_sent_at')
            ->whereNull('invitation_accepted_at')
            ->first();

        if (! $employee) {
            return redirect()->route('login')->with('error', __('Invalid or expired invitation link.'));
        }

        // Check if invitation is expired (7 days)
        if ($employee->invitation_sent_at->addDays(7)->isPast()) {
            return redirect()->route('login')->with('error', __('This invitation has expired. Please contact your employer for a new invitation.'));
        }

        return Inertia::render('auth/accept-invitation', [
            'token' => $token,
            'employee' => [
                'name' => $employee->name,
                'email' => $employee->email,
            ],
            'company' => [
                'name' => $employee->company->name,
            ],
        ]);
    }

    public function acceptInvitation(Request $request, string $token): RedirectResponse
    {
        $employee = Employee::where('invitation_token', $token)
            ->whereNotNull('invitation_sent_at')
            ->whereNull('invitation_accepted_at')
            ->first();

        if (! $employee) {
            return redirect()->route('login')->with('error', __('Invalid or expired invitation link.'));
        }

        // Check if invitation is expired
        if ($employee->invitation_sent_at->addDays(7)->isPast()) {
            return redirect()->route('login')->with('error', __('This invitation has expired.'));
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Check if user already exists
        $existingUser = User::where('email', $employee->email)->first();
        if ($existingUser) {
            return redirect()->route('login')->with('error', __('An account already exists for this email.'));
        }

        // Create user account
        $user = User::create([
            'name' => $employee->name,
            'email' => $employee->email,
            'password' => Hash::make($validated['password']),
        ]);

        // Link employee to user and mark invitation as accepted
        $employee->update([
            'user_id' => $user->id,
            'invitation_accepted_at' => now(),
        ]);

        // Add user to company with role from employee record (admin or employee)
        $role = $employee->role === 'admin' ? User::ROLE_ADMIN : User::ROLE_EMPLOYEE;
        $user->companies()->attach($employee->company_id, ['role' => $role]);

        return redirect()->route('login')->with('success', __('Account created successfully! You can now log in.'));
    }
}
