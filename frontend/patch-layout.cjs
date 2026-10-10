const fs = require('fs');
const path = 'src/components/layout/DashboardLayout.jsx';
let c = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.bak', c);

const hasCRLF = c.includes('\r\n');
c = c.replace(/\r\n/g, '\n');

let changes = 0;

// 1. Add import
const anchor1 = `import BottomNavigation from './BottomNavigation';`;
const repl1 = `import BottomNavigation from './BottomNavigation';
import AICoachFAB from '../AICoachFAB';`;

if (!c.includes("import AICoachFAB")) {
  if (c.includes(anchor1)) {
    c = c.replace(anchor1, repl1);
    changes++;
    console.log('OK: import added');
  } else {
    console.log('MISS: import anchor');
  }
} else {
  console.log('SKIP: import already present');
}

// 2. Render <AICoachFAB /> before closing </div>
const anchor2 = `      <BottomNavigation user={userStats} logout={logout} />
    </div>
  );
};`;

const repl2 = `      <BottomNavigation user={userStats} logout={logout} />
      <AICoachFAB />
    </div>
  );
};`;

if (!c.includes('<AICoachFAB />')) {
  if (c.includes(anchor2)) {
    c = c.replace(anchor2, repl2);
    changes++;
    console.log('OK: FAB mounted');
  } else {
    console.log('MISS: closing anchor');
  }
} else {
  console.log('SKIP: FAB already mounted');
}

if (hasCRLF) c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(path, c, 'utf8');
fs.unlinkSync(path + '.bak');

console.log('');
console.log('Changes: ' + changes);
