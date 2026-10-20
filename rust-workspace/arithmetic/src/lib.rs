#[unsafe(no_mangle)]
pub extern "C" fn double(value: f64) -> f64 {
    value * 2.0
}

#[cfg(test)]
mod tests {
    use super::double;

    #[test]
    fn doubles_positive_and_negative_values() {
        assert_eq!(double(21.0), 42.0);
        assert_eq!(double(-1.5), -3.0);
    }
}
