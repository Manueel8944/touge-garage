<?php

function isValidObjectId($value)
{
    return is_string($value) && preg_match('/^[a-f0-9]{24}$/i', $value) === 1;
}
