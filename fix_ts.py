import re

# 1. lib/auth.ts
f = r'd:\school-management-system\school-management-system\lib\auth.ts'
with open(f, 'r', encoding='utf-8') as file: c = file.read()
c = c.replace("req.headers?.['x-forwarded-for'] as string", "(req.headers.get ? req.headers.get('x-forwarded-for') : req.headers?.['x-forwarded-for']) as string")
c = c.replace("req.headers?.['x-real-ip'] as string", "(req.headers.get ? req.headers.get('x-real-ip') : req.headers?.['x-real-ip']) as string")
with open(f, 'w', encoding='utf-8') as file: file.write(c)

# 2. globalRateLimit.ts
f = r'd:\school-management-system\school-management-system\lib\security\globalRateLimit.ts'
with open(f, 'r', encoding='utf-8') as file: c = file.read()
c = c.replace('for (const [key, entry] of windows.entries()) {\n    if (now > entry.resetAt) windows.delete(key)\n  }', 'windows.forEach((entry, key) => { if (now > entry.resetAt) windows.delete(key) })')
with open(f, 'w', encoding='utf-8') as file: file.write(c)

# 3. rateLimiter.ts
f = r'd:\school-management-system\school-management-system\lib\security\rateLimiter.ts'
with open(f, 'r', encoding='utf-8') as file: c = file.read()
c = re.sub(r'for\s*\(\s*const\s*\[\s*key\s*,\s*entry\s*\]\s*of\s*store\.entries\(\s*\)\s*\)\s*\{', 'store.forEach((entry, key) => {', c)
c = c.replace('  }\n}, 60 * 60 * 1000)', '  })\n}, 60 * 60 * 1000)')
with open(f, 'w', encoding='utf-8') as file: file.write(c)

# 4. ownershipGuard.ts
f = r'd:\school-management-system\school-management-system\lib\security\ownershipGuard.ts'
with open(f, 'r', encoding='utf-8') as file: c = file.read()
c = c.replace('children:', 'students:')
c = c.replace('parent?.children', 'parent?.students')
c = c.replace('c =>', '(c: any) =>')
with open(f, 'w', encoding='utf-8') as file: file.write(c)

# 5. suspend route
f = r'd:\school-management-system\school-management-system\app\api\discipline\reports\[id]\suspend\route.ts'
with open(f, 'r', encoding='utf-8') as file: c = file.read()
c = c.replace("if (data.action !== 'SUSPENSION')", "if (data!.action !== 'SUSPENSION')")
c = c.replace('data.action', 'data!.action')
c = c.replace('data.suspendedFrom', '(data as any).suspendedFrom')
c = c.replace('data.suspendedUntil', '(data as any).suspendedUntil')
c = c.replace('data.reason', '(data as any).reason')
c = c.replace('type: "DISCIPLINE",', 'type: "DISCIPLINE" as "DISCIPLINE",')
with open(f, 'w', encoding='utf-8') as file: file.write(c)

# 6. conversations route
f = r'd:\school-management-system\school-management-system\app\api\messages\conversations\route.ts'
with open(f, 'r', encoding='utf-8') as file: c = file.read()
c = c.replace('const { type, participantIds, name, classId } = data', 'const { type, participantIds, name, classId } = data!')
with open(f, 'w', encoding='utf-8') as file: file.write(c)

print('Fixed TS errors')
