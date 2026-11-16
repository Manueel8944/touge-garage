<?php

class User
{
    public static function schema()
    {
        return [
            'name' => '',
            'email' => '',
            'password' => '',
            'admin' => false,
            'image' => null
        ];
    }
}