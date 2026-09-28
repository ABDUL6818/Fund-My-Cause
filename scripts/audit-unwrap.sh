#!/bin/bash

echo "🔍 Auditing for unwrap/expect/panic in contract code..."
echo "========================================"

# Search for unwrap
echo "📋 Checking for unwrap():"
find contracts/crowdfund/src/ -name "*.rs" -exec grep -n "unwrap()" {} \; | grep -v "tests" | grep -v "#\[test\]"

# Search for expect
echo ""
echo "📋 Checking for expect():"
find contracts/crowdfund/src/ -name "*.rs" -exec grep -n "expect(" {} \; | grep -v "tests" | grep -v "#\[test\]"

# Search for panic
echo ""
echo "📋 Checking for panic!():"
find contracts/crowdfund/src/ -name "*.rs" -exec grep -n "panic!" {} \; | grep -v "tests" | grep -v "#\[test\]"

echo ""
echo "========================================"

# Count occurrences
UNWRAP_COUNT=$(find contracts/crowdfund/src/ -name "*.rs" -exec grep -l "unwrap()" {} \; | grep -v "tests" | wc -l)
EXPECT_COUNT=$(find contracts/crowdfund/src/ -name "*.rs" -exec grep -l "expect(" {} \; | grep -v "tests" | wc -l)
PANIC_COUNT=$(find contracts/crowdfund/src/ -name "*.rs" -exec grep -l "panic!" {} \; | grep -v "tests" | wc -l)

echo "📊 Summary:"
echo "  Files with unwrap(): $UNWRAP_COUNT"
echo "  Files with expect(): $EXPECT_COUNT"
echo "  Files with panic!(): $PANIC_COUNT"

if [ $UNWRAP_COUNT -eq 0 ] && [ $EXPECT_COUNT -eq 0 ] && [ $PANIC_COUNT -eq 0 ]; then
    echo ""
    echo "✅ No unjustified unwrap/expect/panic found in contract code!"
else
    echo ""
    echo "⚠️  Found potential issues - please review the output above."
    exit 1
fi
