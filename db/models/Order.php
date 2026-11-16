<?php

class Order
{
    public static function schema()
    {
        return [
            'user_id' => null,
            'products' => [
                [
                    'product_id' => null,
                    'quantity' => 0
                ]
            ],
            'total' => 0,
            'status' => 'cart'
        ];
    }
}