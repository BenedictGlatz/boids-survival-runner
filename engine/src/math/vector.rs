/// A two-dimensional vector with f32 components.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Vec2 {
    pub x: f32,
    pub y: f32,
}

impl Vec2 {
    pub fn new(x: f32, y: f32) -> Self {
        Self { x, y }
    }

    pub fn zero() -> Self {
        Self { x: 0.0, y: 0.0 }
    }

    pub fn length(self) -> f32 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    pub fn length_squared(self) -> f32 {
        self.x * self.x + self.y * self.y
    }

    pub fn normalize(self) -> Self {
        let len = self.length();
        if len == 0.0 {
            Self::zero()
        } else {
            Self {
                x: self.x / len,
                y: self.y / len,
            }
        }
    }

    pub fn dot(self, other: Self) -> f32 {
        self.x * other.x + self.y * other.y
    }

    /// The 2D cross product, which is a single number rather than a vector.
    ///
    /// Its sign says which side of `self` the other vector lies on, and it is zero
    /// exactly when the two are parallel. That is what the segment intersection test
    /// needs, and it is the length of the 3D cross product of the same two vectors
    /// laid flat in the plane.
    pub fn cross(self, other: Self) -> f32 {
        self.x * other.y - self.y * other.x
    }

    /// Turns the vector a quarter turn to the left, keeping its length.
    ///
    /// The result is perpendicular to the original, which is how an obstacle's
    /// surface normal is turned into the tangent a boid slides along.
    pub fn perp(self) -> Self {
        Self {
            x: -self.y,
            y: self.x,
        }
    }

    pub fn scale(self, factor: f32) -> Self {
        Self {
            x: self.x * factor,
            y: self.y * factor,
        }
    }

    pub fn add(self, other: Self) -> Self {
        Self {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }

    pub fn sub(self, other: Self) -> Self {
        Self {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }

    pub fn limit(self, max: f32) -> Self {
        if self.length_squared() > max * max {
            self.normalize().scale(max)
        } else {
            self
        }
    }

    pub fn distance_to(self, other: Self) -> f32 {
        self.sub(other).length()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn zero_vector_has_zero_length() {
        assert_eq!(Vec2::zero().length(), 0.0);
    }

    #[test]
    fn normalize_unit_vector_unchanged() {
        let v = Vec2::new(1.0, 0.0);
        let n = v.normalize();
        assert!((n.x - 1.0).abs() < f32::EPSILON);
        assert!(n.y.abs() < f32::EPSILON);
    }

    #[test]
    fn normalize_zero_vector_returns_zero() {
        let n = Vec2::zero().normalize();
        assert_eq!(n, Vec2::zero());
    }

    #[test]
    fn limit_caps_length() {
        let v = Vec2::new(10.0, 0.0);
        let limited = v.limit(5.0);
        assert!((limited.length() - 5.0).abs() < 1e-5);
    }

    #[test]
    fn cross_is_zero_for_parallel_vectors() {
        // The segment intersection test reads this zero as "these two lines never
        // cross", so a non-zero result for parallel input would report a phantom hit.
        let right = Vec2::new(3.0, 0.0);
        let also_right = Vec2::new(7.0, 0.0);
        let left = Vec2::new(-2.0, 0.0);

        assert_eq!(right.cross(also_right), 0.0);
        assert_eq!(right.cross(left), 0.0);
    }

    #[test]
    fn cross_changes_sign_with_the_side_the_other_vector_is_on() {
        let right = Vec2::new(1.0, 0.0);

        assert!(right.cross(Vec2::new(0.0, 1.0)) > 0.0);
        assert!(right.cross(Vec2::new(0.0, -1.0)) < 0.0);
    }

    #[test]
    fn perp_is_orthogonal_and_keeps_the_length() {
        let v = Vec2::new(3.0, 4.0);
        let turned = v.perp();

        assert_eq!(v.dot(turned), 0.0);
        assert!((turned.length() - v.length()).abs() < 1e-5);
    }
}
