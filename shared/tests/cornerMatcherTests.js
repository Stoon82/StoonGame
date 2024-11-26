import TriangleCornerMatcher from '../world/TriangleCornerMatcher.js';

class CornerMatcherTests {
    constructor() {
        this.matcher = new TriangleCornerMatcher();
    }

    testNeighborRelation(triangle1, triangle2) {
        // Get all expected neighbor relations for triangle1
        const relations = this.matcher.getNeighborRelations(triangle1.q, triangle1.r);
        
        // Find the relation that matches triangle2's position
        const relation = relations.find(r => r.q === triangle2.q && r.r === triangle2.r);
        
        if (!relation) {
            console.log('\nTest Case:');
            console.log(`Triangle 1 at (${triangle1.q},${triangle1.r})`);
            console.log(`Triangle 2 at (${triangle2.q},${triangle2.r})`);
            console.log('Result: FAILED - Triangles are not neighbors');
            return false;
        }

        // Test if the corners match
        const result = this.matcher.doCornerTypesMatch(
            triangle1, relation.myCorner,
            triangle2, relation.theirCorner
        );

        console.log('\nTest Case:');
        console.log('Neighbor Relation:', relation.description);
        console.log('Triangle 1:', result.details.triangle1);
        console.log('Triangle 2:', result.details.triangle2);
        console.log(`Match Result: ${result.matches ? 'PASSED' : 'FAILED'}`);

        return result.matches;
    }

    runAllTests() {
        console.log('Running Corner Matcher Tests...\n');
        let passedTests = 0;
        let totalTests = 0;

        // Test Case 1: Upward triangle with its top neighbor
        totalTests++;
        if (this.testNeighborRelation(
            { q: 0, r: 0, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            { q: 0, r: 1, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] }
        )) passedTests++;

        // Test Case 2: Upward triangle with its bottom-right neighbor
        totalTests++;
        if (this.testNeighborRelation(
            { q: 0, r: 0, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            { q: 1, r: 0, groundTypes: ['GRASS', 'SAND', 'WATER', 'ROCK'] }
        )) passedTests++;

        // Test Case 3: Downward triangle with its top-left neighbor
        totalTests++;
        if (this.testNeighborRelation(
            { q: 1, r: 1, groundTypes: ['GRASS', 'SAND', 'WATER', 'ROCK'] },
            { q: 0, r: 1, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] }
        )) passedTests++;

        // Test Case 4: Non-neighbor triangles (should fail)
        totalTests++;
        if (!this.testNeighborRelation(
            { q: 0, r: 0, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] },
            { q: 2, r: 2, groundTypes: ['GRASS', 'WATER', 'SAND', 'ROCK'] }
        )) passedTests++;

        console.log(`\nTest Summary: ${passedTests}/${totalTests} tests passed`);
    }
}

// Run the tests
const tests = new CornerMatcherTests();
tests.runAllTests();
