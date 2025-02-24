The `_transfer` function contains a critical self-transfer vulnerability allowing users to inflate their balance by
transferring to themselves. This occurs due to improper handling when `_from == _to` , enabling attackers to
mint unlimited tokens.