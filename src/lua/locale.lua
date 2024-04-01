-- locale.lua
-- @Author : Dencer (tdaddon@163.com)
-- @Link   : https://dengsir.github.io
-- @Date   : 4/1/2024, 10:20:57 AM
--
local llex = require('llex')

local function resolveLocale(l)
    l = l:match([[^'(.+)'$]]) or l
    l = l:match([[^"(.+)"$]]) or l
    l = l:match([[^%[=*%[(.+)%]=*%]$]]) or l
    l = l:gsub('\\', '')
    return l
end

local function cacheLocaleInternal(i, closeOp)
    local l
    while true do
        local tok = llex.tok[i]
        local sem = llex.seminfo[i]

        if tok == 'TK_STRING' or tok == 'TK_LSTRING' then
            l = sem
        elseif tok == 'TK_NAME' and closeOp == nil then
            return i + 1, sem
        elseif tok == 'TK_OP' then
            if sem == closeOp then
                return i + 1, l
            end
        elseif tok == 'TK_SPACE' or tok == 'TK_EOL' then
        else
            return
        end

        i = i + 1
    end
end

local function catchLocale(i)
    while true do
        local tok = llex.tok[i]
        local sem = llex.seminfo[i]
        if tok == 'TK_OP' then
            if sem == '.' then
                return cacheLocaleInternal(i + 1)
            elseif sem == '[' then
                return cacheLocaleInternal(i + 1, ']')
            else
                return
            end
        elseif tok == 'TK_SPACE' or tok == 'TK_COMMENT' or tok == 'TK_LCOMMENT' then
        else
            return
        end

        i = i + 1
    end
end

local function scanLocale(locales, code)
    llex.init(code)
    llex.llex()

    locales = locales or {}

    local i = 0
    while i < #llex.tok do
        local tok = llex.tok[i]
        local sem = llex.seminfo[i]
        local ii, l

        if tok == 'TK_NAME' and sem == 'L' then
            ii, l = catchLocale(i + 1)
            if ii and l then
                local sl = resolveLocale(l)
                locales[sl] = locales[sl] or {}
                locales[sl][l] = true
            end
        end
        i = ii or (i + 1)
    end
    return locales
end

-- local function readFile(p)
--     print(p, io.close)
--     local f, e = io.open(p, 'r')
--     print(f, e)
--     local d = f:read('*a')
--     f:close()
--     return d
-- end

-- local function writeFile(p, d)
--     local f = io.open(p, 'wb')
--     f:write(d)
--     f:close()
-- end

local function scanFiles(paths)
    local locales = {}
    for i, p in ipairs(paths) do
        scanLocale(locales, readFile(p))
    end
    return locales
end

local function catchAssign(i)
    local afterAssign = false
    while true do
        local tok = llex.tok[i]
        local sem = llex.seminfo[i]

        if tok ~= 'TK_SPACE' and tok ~= 'TK_EOL' then
            if afterAssign then
                if tok == 'TK_STRING' or tok == 'TK_LSTRING' or (tok == 'TK_KEYWORD' and sem == 'true') then
                    return i + 1, sem
                else
                    error('invalid locale')
                end
            end

            if tok == 'TK_OP' and sem == '=' then
                afterAssign = true
            end
        end

        i = i + 1
    end
end

local function removeLocales(p, locales)
    if not next(locales) then
        return
    end

    llex.init(readFile(p))
    llex.llex()

    local data = {}

    local i = 0
    while i < #llex.tok do
        local tok = llex.tok[i]
        local sem = llex.seminfo[i]
        local ii, l

        if tok == 'TK_NAME' and sem == 'L' then
            ii, l = catchLocale(i + 1)
            if ii and l and locales[resolveLocale(l)] then
                local iii = catchAssign(ii)
                if not iii then
                    error('invalid locale')
                else
                    ii = iii

                    table.insert(data, '--[====[ never used ]====]\n')
                    table.insert(data, '--[====[ ')
                    for j = i, ii - 1 do
                        table.insert(data, llex.seminfo[j])
                    end
                    table.insert(data, ' ]====]')
                end
            else
                ii = nil
                table.insert(data, sem)
            end
        else
            table.insert(data, sem)
        end

        i = ii or (i + 1)
    end

    writeFile(p, table.concat(data, ''))
end

local function insertLocales(p, locales)
    if not next(locales) then
        return
    end

    local d = readFile(p)
    if not d:find('%-%-%s*@locale%-fill@') then
        return
    end

    local data = {}

    local keys = {}
    for k in pairs(locales) do
        table.insert(keys, k)
    end

    table.sort(keys)

    for _, k in ipairs(keys) do
        if k:find('^[%w_]+$') then
            table.insert(data, string.format('L.%s = true', k))
        else
            k = k:gsub([[']], [[\']])
            table.insert(data, string.format([[L['%s'] = true]], k))
        end
    end

    writeFile(p, d:gsub('%-%-%s*@locale%-fill@', function(x)
        return table.concat(data, '\n') .. '\n' .. x
    end))
end

local function scan(args)
    local localesNew = scanFiles(args.files)

    for _, p in ipairs(args.oldFiles) do
        local localesOld = scanFiles({p})

        local localesAdd = {}
        do
            for k, v in pairs(localesNew) do
                if not localesOld[k] then
                    localesAdd[k] = v
                end
            end
        end

        local localesLost = {}
        do
            for k, v in pairs(localesOld) do
                if not localesNew[k] then
                    localesLost[k] = v
                end
            end
        end

        insertLocales(p, localesAdd)
        removeLocales(p, localesLost)
    end
end

local actions = {scan = scan}

function locale(args)
    if not args or not args.action then
        error('invalid args')
    end
    local action = actions[args.action]
    if not action then
        error('invalid action')
    end

    scan(args)
end
