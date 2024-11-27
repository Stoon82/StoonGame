export class StoonieReproduction {
    constructor(gender = Math.random() < 0.5 ? 'male' : 'female') {
        this.gender = gender;
        this.age = 0; // Age in days
        this.maxAge = 70 + Math.random() * 30; // Random max age between 70-100 days
        this.pregnant = false;
        this.pregnancyProgress = 0; // 0-1
        this.pregnancyDuration = 9; // 9 days for pregnancy
    }

    update(deltaTime) {
        // Update age
        this.age += deltaTime / 24; // Convert seconds to days

        // Update pregnancy if pregnant
        if (this.pregnant) {
            this.pregnancyProgress += deltaTime / (this.pregnancyDuration * 24); // Convert days to seconds
            if (this.pregnancyProgress >= 1) {
                return this.giveBirth();
            }
        }

        return null; // No birth this update
    }

    // Attempt to mate with another Stoonie
    mate(partner) {
        if (!partner || partner.gender === this.gender) return false;
        if (this.gender === 'female' && !this.pregnant && this.age > 18) {
            this.startPregnancy();
            return true;
        }
        return false;
    }

    startPregnancy() {
        if (this.gender === 'female' && !this.pregnant) {
            this.pregnant = true;
            this.pregnancyProgress = 0;
            return true;
        }
        return false;
    }

    // Give birth to a new Stoonie
    giveBirth() {
        if (!this.pregnant || this.pregnancyProgress < 1) return null;
        
        this.pregnant = false;
        this.pregnancyProgress = 0;
        
        // Return birth event data
        return {
            event: 'birth',
            gender: Math.random() < 0.5 ? 'male' : 'female'
        };
    }

    isDead() {
        return this.age >= this.maxAge;
    }

    getReproductiveStatus() {
        return {
            gender: this.gender,
            age: this.age,
            pregnant: this.pregnant,
            pregnancyProgress: this.pregnancyProgress,
            fertile: this.gender === 'female' && !this.pregnant && this.age > 18
        };
    }
}
