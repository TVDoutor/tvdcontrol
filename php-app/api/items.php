<?php

// Simplified items API - basic CRUD for inventory items
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../utils/UUID.php';

$db = Database::getInstance();
$user = AuthMiddleware::requireAuth();

$itemId = isset($segments[1]) ? $segments[1] : null;

if ($method === 'GET' && !$itemId) {
    // GET /items - List all items
    $items = $db->query("SELECT * FROM inventory_items ORDER BY created_at DESC");
    Response::success($items);
    
} elseif ($method === 'GET' && $itemId) {
    // GET /items/:id
    $item = $db->queryOne("SELECT * FROM inventory_items WHERE id = ?", [$itemId]);
    
    if (!$item) {
        Response::notFound('Item não encontrado');
    }
    
    Response::success($item);
    
} elseif ($method === 'POST') {
    // POST /items - Create new item
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = UUID::generate();
    $category = $input['category'] ?? null;
    $name = $input['name'] ?? null;
    $model = $input['model'] ?? null;
    $serialNumber = $input['serialNumber'] ?? null;
    
    if (!$category || !$name || !$model || !$serialNumber) {
        Response::error('Campos obrigatórios: category, name, model, serialNumber');
    }
    
    try {
        $db->execute(
            "INSERT INTO inventory_items (id, category, name, model, serial_number, manufacturer, type, asset_tag, sku, icon, status, assigned_to_user_id, purchase_date, purchase_price, warranty_end, location, specs, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $id,
                $category,
                $name,
                $model,
                $serialNumber,
                $input['manufacturer'] ?? null,
                $input['type'] ?? null,
                $input['assetTag'] ?? null,
                $input['sku'] ?? null,
                $input['icon'] ?? null,
                $input['status'] ?? 'available',
                $input['assignedTo'] ?? null,
                $input['purchaseDate'] ?? null,
                $input['purchasePrice'] ?? null,
                $input['warrantyEnd'] ?? null,
                $input['location'] ?? null,
                $input['specs'] ?? null,
                $input['notes'] ?? null,
            ]
        );
        
        $item = $db->queryOne("SELECT * FROM inventory_items WHERE id = ?", [$id]);
        Response::success($item, 201);
    } catch (Exception $e) {
        error_log('[items.php POST] Error: ' . $e->getMessage());
        error_log('[items.php POST] Input: ' . json_encode($input));
        Response::error('Erro ao criar item: ' . $e->getMessage(), 500);
    }
    
} elseif ($method === 'PUT' && $itemId) {
    // PUT /items/:id - Update item
    $input = json_decode(file_get_contents('php://input'), true);
    
    $existing = $db->queryOne("SELECT * FROM inventory_items WHERE id = ?", [$itemId]);
    
    if (!$existing) {
        Response::notFound('Item não encontrado');
    }
    
    $updates = [];
    $values = [];
    
    $fields = ['category', 'name', 'model', 'serial_number', 'manufacturer', 'type', 'asset_tag', 'sku', 'icon', 'status', 'assigned_to_user_id', 'purchase_date', 'purchase_price', 'warranty_end', 'location', 'specs', 'notes'];
    
    foreach ($fields as $field) {
        $camelField = lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $field))));
        if (isset($input[$camelField])) {
            $updates[] = "$field = ?";
            $values[] = $input[$camelField];
        }
    }
    
    if (count($updates) === 0) {
        Response::success($existing);
    }
    
    $values[] = $itemId;
    $db->execute("UPDATE inventory_items SET " . implode(', ', $updates) . " WHERE id = ?", $values);
    
    $updated = $db->queryOne("SELECT * FROM inventory_items WHERE id = ?", [$itemId]);
    Response::success($updated);
    
} elseif ($method === 'DELETE' && $itemId) {
    // DELETE /items/:id
    $item = $db->queryOne("SELECT id FROM inventory_items WHERE id = ?", [$itemId]);
    
    if (!$item) {
        Response::notFound('Item não encontrado');
    }
    
    $db->execute("DELETE FROM inventory_items WHERE id = ?", [$itemId]);
    Response::noContent();
    
} else {
    Response::error('Invalid items route', 404);
}
