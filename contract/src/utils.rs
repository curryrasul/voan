pub(crate) fn depth(num: usize) -> u8 {
    let mut res = 0;
    let mut temp_num = 1;
    while temp_num < num {
        temp_num *= 2;
        res += 1;
    }
    res
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_depth() {
        assert_eq!(depth(5), 3);
        assert_eq!(depth(0), 0);
        assert_eq!(depth(16), 4);
        assert_eq!(depth(127), 7);
    }
}
