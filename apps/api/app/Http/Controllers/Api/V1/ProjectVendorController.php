<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProjectVendor;
use Illuminate\Http\Request;

class ProjectVendorController extends Controller
{
    public function index(Request $request)
    {
        $query = ProjectVendor::query();

        if ($request->has('search')) {
            $query->where('name', 'ilike', '%' . $request->search . '%');
        }

        $vendors = $query->orderBy('name', 'asc')->paginate($request->get('per_page', 50));

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

    public function show($id)
    {
        $vendor = ProjectVendor::findOrFail($id);
        return response()->json($vendor);
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
}
