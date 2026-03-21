<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\JobType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class JobTypeController extends Controller
{
    public function index(Request $request): Response
    {
        $companyId = (int) session('current_company_id');

        $jobTypes = JobType::where('company_id', $companyId)
            ->withCount('jobs')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (JobType $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'sort_order' => $t->sort_order,
                'is_other' => $t->is_other,
                'jobs_count' => $t->jobs_count,
            ]);

        return Inertia::render('settings/job-types', [
            'jobTypes' => $jobTypes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        $this->normalizeSortOrderInput($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('job_types', 'name')->where('company_id', $companyId),
            ],
            'is_other' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $maxSort = JobType::where('company_id', $companyId)->max('sort_order');

        JobType::create([
            'company_id' => $companyId,
            'name' => $validated['name'],
            'is_other' => $validated['is_other'] ?? false,
            'sort_order' => $validated['sort_order'] ?? (($maxSort ?? -1) + 1),
        ]);

        return redirect()->route('settings.job-types.index')
            ->with('success', __('Job type created.'));
    }

    public function update(Request $request, JobType $jobType): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        if ($jobType->company_id !== $companyId) {
            abort(404);
        }

        $this->normalizeSortOrderInput($request);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('job_types', 'name')
                    ->where('company_id', $companyId)
                    ->ignore($jobType->id),
            ],
            'is_other' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $jobType->update([
            'name' => $validated['name'],
            'is_other' => $validated['is_other'] ?? $jobType->is_other,
            'sort_order' => $validated['sort_order'] ?? $jobType->sort_order,
        ]);

        return redirect()->route('settings.job-types.index')
            ->with('success', __('Job type updated.'));
    }

    public function destroy(Request $request, JobType $jobType): RedirectResponse
    {
        $companyId = (int) session('current_company_id');
        if ($jobType->company_id !== $companyId) {
            abort(404);
        }

        if ($jobType->jobs()->exists()) {
            return back()->withErrors([
                'delete' => __('This job type cannot be deleted because it is used by one or more jobs.'),
            ]);
        }

        $jobType->delete();

        return redirect()->route('settings.job-types.index')
            ->with('success', __('Job type deleted.'));
    }

    private function normalizeSortOrderInput(Request $request): void
    {
        $v = $request->input('sort_order');
        if ($v === '' || $v === null) {
            $request->merge(['sort_order' => null]);
        }
    }
}
