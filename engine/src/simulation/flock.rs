use super::boid::Boid;

/// Manages the collection of all active boids.
pub struct Flock {
    pub boids: Vec<Boid>,
}

impl Flock {
    pub fn new() -> Self {
        Self { boids: Vec::new() }
    }

    pub fn add(&mut self, boid: Boid) {
        self.boids.push(boid);
    }

    pub fn len(&self) -> usize {
        self.boids.len()
    }
}
