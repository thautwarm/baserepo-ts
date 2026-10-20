use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
struct DoubleRequest {
    value: i64,
}

#[derive(Deserialize, Serialize, Debug, PartialEq)]
#[serde(untagged)]
enum DoubleReply {
    Value { value: i64 },
    Error { error: String },
}

pub(crate) fn process(input: &[u8]) -> Vec<u8> {
    let reply = match rmp_serde::from_slice::<DoubleRequest>(input) {
        Ok(request) => match crate::double(request.value) {
            Some(value) => DoubleReply::Value { value },
            None => DoubleReply::Error {
                error: "i64 overflow".into(),
            },
        },
        Err(error) => DoubleReply::Error {
            error: format!("Invalid MessagePack request: {error}"),
        },
    };
    rmp_serde::to_vec_named(&reply).expect("integer and string replies are serializable")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(value: i64) -> DoubleReply {
        let input = rmp_serde::to_vec_named(&DoubleRequest { value }).unwrap();
        rmp_serde::from_slice(&process(&input)).unwrap()
    }

    #[test]
    fn messagepack_preserves_i64_values() {
        for value in [0, 21, -3, i64::MIN / 2, i64::MAX / 2] {
            assert_eq!(request(value), DoubleReply::Value { value: value * 2 });
        }
    }

    #[test]
    fn overflow_and_malformed_requests_produce_messagepack_errors() {
        for value in [i64::MIN, i64::MAX] {
            assert_eq!(
                request(value),
                DoubleReply::Error {
                    error: "i64 overflow".into()
                }
            );
        }
        let reply: DoubleReply = rmp_serde::from_slice(&process(&[0xc1])).unwrap();
        assert!(matches!(reply, DoubleReply::Error { .. }));
    }
}
