<?php

namespace App\Http\Controllers\Api\V1\Project;

use App\Http\Controllers\Controller;
use App\Models\ProjectVendor;
use App\Services\PolicyService;
use Illuminate\Http\Request;

class ProjectVendorController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['search' => 'nullable|string|max:255', 'per_page' => 'nullable|integer|min:1|max:100', 'page' => 'nullable|integer|min:1']);
        $query = ProjectVendor::query();
        if (! empty($filters['search'])) {
            $query->whereLike('name', '%'.$filters['search'].'%');
        }
        if (! $this->canReadContact($request)) {
            $query->select(['id', 'name', 'category', 'created_at', 'updated_at']);
        }
        $vendors = $query->orderBy('name', 'asc')->paginate($filters['per_page'] ?? 50);

        return response()->json($vendors);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'bank_details' => 'nullable|string',
        ]);

        $vendor = ProjectVendor::create($validated);

        return response()->json($vendor, 201);
    }

    public function show(Request $request, $id)
    {
        $vendor = ProjectVendor::findOrFail($id);

        return response()->json($this->canReadContact($request) ? $vendor : $vendor->only(['id', 'name', 'category', 'created_at', 'updated_at']));
    }

    public function update(Request $request, $id)
    {
        $vendor = ProjectVendor::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'category' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'bank_details' => 'nullable|string',
        ]);

        $vendor->update($validated);

        return response()->json($vendor);
    }

    public function destroy($id)
    {
        $vendor = ProjectVendor::findOrFail($id);
        $vendor->delete();

        return response()->json(null, 204);
    }

    private function canReadContact(Request $request): bool
    {
        $user = $request->attributes->get('user') ?? [];

        return ($user['role'] ?? '') === 'BOD' || app(PolicyService::class)->hasCapability($user, 'manage:projects');
    }
}
