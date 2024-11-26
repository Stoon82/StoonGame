import TriangleGrid from '../world/TriangleGrid.js';

class TriangleGridTests {
    constructor() {
        this.grid = new TriangleGrid(10, 10);
    }

    // Test helper to create a triangle with specific ground types
    createTriangle(q, r, groundTypes) {
        this.grid.addTriangle(q, r, { groundTypes });
    }

    // Test specific corner matching between two triangles
    testCornerMatch(triangle1, triangle2, expectedMatch) {
        const { q: q1, r: r1, groundTypes: types1 } = triangle1;
        const { q: q2, r: r2, groundTypes: types2 } = triangle2;

        // Place the first triangle
        this.createTriangle(q1, r1, types1);

        // Test if the second triangle's ground types are valid
        const isValid = this.grid.validateGroundTypes(q2, r2, types2);

        console.log('\nTest Case:');
        console.log(`Triangle 1 at (${q1},${r1}):`, types1);
        console.log(`Triangle 2 at (${q2},${r2}):`, types2);
        console.log(`Expected match: ${expectedMatch}`);
        console.log(`Actual result: ${isValid}`);
        console.log(`Test ${isValid === expectedMatch ? 'PASSED' : 'FAILED'}`);

        // Clear the grid for the next test
        this.grid.clear();
        return isValid === expectedMatch;
    }

    runAllTests() {
        console.log('Running Triangle Grid Tests...\n');
        let passedTests = 0;
        let totalTests = 0;

        // Test Case 1: Upward triangle matching with bottom-right neighbor
        // Triangle 1 (upward) at (0,0)
        // Triangle 2 (downward) at (1,0)
        // Should match at Triangle1's bottom-right corner (2) with Triangle2's top-left corner (1)
        totalTests++;
        if (this.testCornerMatch(
            { q: 0, r: 0, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            { q: 1, r: 0, groundTypes: ['GRASS', 'SAND', 'WATER', 'ROCK'] },
            true
        )) passedTests++;

        // Test Case 2: Upward triangle matching with top neighbor
        // Triangle 1 (upward) at (0,0)
        // Triangle 2 (downward) at (0,1)
        // Should match at Triangle1's top corner (3) with Triangle2's bottom corner (3)
        totalTests++;
        if (this.testCornerMatch(
            { q: 0, r: 0, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            { q: 0, r: 1, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            true
        )) passedTests++;

        // Test Case 3: Downward triangle matching with left neighbor
        // Triangle 1 (downward) at (1,1)
        // Triangle 2 (upward) at (0,1)
        // Should match at Triangle1's top-left corner (1) with Triangle2's bottom-right corner (2)
        totalTests++;
        if (this.testCornerMatch(
            { q: 1, r: 1, groundTypes: ['GRASS', 'SAND', 'WATER', 'ROCK'] },
            { q: 0, r: 1, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            true
        )) passedTests++;

        // Test Case 4: Intentional mismatch
        // Triangle 1 (upward) at (0,0)
        // Triangle 2 (downward) at (1,0)
        // Should fail due to mismatched corner types
        totalTests++;
        if (this.testCornerMatch(
            { q: 0, r: 0, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            { q: 1, r: 0, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            false
        )) passedTests++;

        console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`);
    }
}

// Run the tests
const tests = new TriangleGridTests();
tests.runAllTests();
