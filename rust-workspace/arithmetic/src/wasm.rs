#[unsafe(no_mangle)]
pub extern "C" fn alloc(length: usize) -> *mut u8 {
    Box::into_raw(vec![0u8; length].into_boxed_slice()) as *mut u8
}

/// # Safety
/// `pointer` and `length` must describe a live buffer returned by this module.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn dealloc(pointer: *mut u8, length: usize) {
    unsafe {
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(
            pointer, length,
        )));
    }
}

/// # Safety
/// The input must remain readable for `length` bytes throughout the call.
/// The caller owns the returned length-prefixed buffer and must deallocate it.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn process(pointer: *const u8, length: usize) -> *mut u8 {
    let input = unsafe { std::slice::from_raw_parts(pointer, length) };
    let payload = crate::protocol::process(input);
    let mut response = Vec::with_capacity(4 + payload.len());
    response.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    response.extend_from_slice(&payload);
    Box::into_raw(response.into_boxed_slice()) as *mut u8
}
