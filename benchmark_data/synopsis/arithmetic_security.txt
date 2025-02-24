`uint256 x = INTEREST_RATE_PER_SECOND * timeElapsed / scale;`

Here we do not need division by scale, because `timeElapsed` is integer, and x is decimal.