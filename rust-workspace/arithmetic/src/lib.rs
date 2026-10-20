#[cfg(any(target_arch = "wasm32", test))]
mod protocol;

#[cfg(target_arch = "wasm32")]
mod wasm;

pub fn double(value: i64) -> Option<i64> {
    value.checked_mul(2)
}

#[cfg(test)]
mod tests {
    use super::double;

    #[test]
    fn doubles_positive_and_negative_values() {
        assert_eq!(double(21), Some(42));
        assert_eq!(double(-3), Some(-6));
        assert_eq!(double(i64::MIN / 2), Some(i64::MIN));
        assert_eq!(double(i64::MAX), None);
    }
}
