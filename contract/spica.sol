// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library SafeMath {
    /**
     * @dev Returns the addition of two unsigned integers, reverting on overflow.
     */
    function add(uint256 a, uint256 b) public  pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");
        return c;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on underflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction underflow");
        uint256 c = a - b;
        return c;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }
        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");
        return c;
    }

    /**
     * @dev Returns the division of two unsigned integers, reverting on division by zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        return c;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, reverting on division by zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

contract MyBEP20Token {
    using SafeMath for uint256;
    string public name;
    string public symbol;
    uint8 public decimals;
    address private owner;
    uint256 public totalSupply;
    uint256 private constant MAX_SUPPLY = 5_000_000_000 * 10**18; // 5 billion tokens 
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) private  _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event OwnershipTransferred(address indexed  owner,address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "オーナーだけがこの関数を呼び出すことができる");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        require(
            _initialSupply <= MAX_SUPPLY,
            "初期供給量が最大供給量を超える"
        );
        owner = msg.sender;
        name = _name;
        symbol = _symbol;
        decimals = _decimals;

        mint(msg.sender, _initialSupply);
    }

    function mint(address _to, uint256 _amount)
        internal
        onlyOwner
        returns (bool)
    {
        require(_amount > 0, "ERR: 金額はゼロより大きくなければならない");
        require(_to != address(0), "ERR: ゼロアドレスに転送");
        totalSupply += _amount;
        balanceOf[_to] += _amount;
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function transfer(address _to, uint256 _value)
        public
        returns (bool success)
    {   
        require(_value!=0,"ERR: 値はゼロより大きくなければならない");
        require(_to != address(0), "ERR: ゼロアドレスに転送");
        require(balanceOf[msg.sender] >= _value, "バランス不足");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function allowance(address _owner, address _spender)
        public
        view
        virtual
        returns (uint256)
    {
        return _allowances[_owner][_spender];
    }

    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        _allowances[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

      function increaseAllowance(address spender, uint256 addedValue) public virtual returns (bool) {
       
        _approve(owner, spender, allowance(owner, spender).add(addedValue));
        return true;
    }

     function decreaseAllowance(address spender, uint256 subtractedValue) public virtual returns (bool) {
        
        uint256 currentAllowance = allowance(owner, spender);
        require(currentAllowance >= subtractedValue, "ERC20：許容範囲がゼロ以下に減少");
        unchecked {
            _approve(owner, spender, currentAllowance.sub(subtractedValue));
        }

        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(_from != address(0), "ERR: ゼロアドレスからの転送");
        require(_to != address(0), "ERR: ゼロアドレスに転送");

        require(balanceOf[_from] >= _value, "ERR：残高不足");
        require(
            _allowances[_from][msg.sender] >= _value,
            "Insufficient allowance"
        );
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        _allowances[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

     function transferOwnership(address _newOwner) private onlyOwner {
        require(_newOwner != address(0), "Ownable: 新所有者の住所をゼロにすることはできない");
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
  }

    function burn(uint256 _amount) public returns (bool) {
        require(_amount > 0, "ERR: 金額はゼロより大きくなければならない");
        require(balanceOf[msg.sender] >= _amount, "バランス不足");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        emit Burn(msg.sender, _amount);
        emit Transfer(msg.sender, address(0), _amount);
        return true;
    }

    function _approve(address _owner, address _spender, uint256 _amount) internal virtual {
        require(_owner != address(0), "ERC20: ゼロアドレスから承認");
        require(_spender != address(0), "ERC20: 承認アドレスはゼロ");

        _allowances[owner][_spender] = _amount;
        emit Approval(owner, _spender, _amount);
    }
}