#!/bin/bash

# Fix escaped newlines in frontend component files
cd "/Users/its.shubhhh/Desktop/memory layer/frontend/app/components/dashboard"

# Fix MessageManagement.tsx
sed -i '' 's/\\n/\
/g' MessageManagement.tsx

# Fix MessageRetrieval.tsx  
sed -i '' 's/\\n/\
/g' MessageRetrieval.tsx

# Fix SearchSection.tsx
sed -i '' 's/\\n/\
/g' SearchSection.tsx

# Fix RequestInspector.tsx
sed -i '' 's/\\n/\
/g' RequestInspector.tsx

echo "Fixed escaped newlines in all component files"
