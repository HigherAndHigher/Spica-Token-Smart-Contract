import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";

describe("MyBEP20Token", function () {
  let MyBEP20Token: Contract;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const MyBEP20TokenFactory = await ethers.getContractFactory("MyBEP20Token");
    MyBEP20Token = await MyBEP20TokenFactory.deploy(
      "MyToken",
      "MTK",
      18,
      ethers.utils.parseEther("1000") // 初期供給量 1000トークン
    );
    await MyBEP20Token.deployed();
  });

  it("名前、記号、小数点以下が正確でなければなりません。", async function () {
    expect(await MyBEP20Token.name()).to.equal("MyToken");
    expect(await MyBEP20Token.symbol()).to.equal("MTK");
    expect(await MyBEP20Token.decimals()).to.equal(18);
  });

  it("所有者に初期供給を割り当てる必要があります。", async function () {
    const ownerBalance = await MyBEP20Token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther("1000"));
  });

  it("アカウント間でトークンを転送する必要がある場合", async function () {
    await MyBEP20Token.transfer(addr1.address, ethers.utils.parseEther("100"));
    const addr1Balance = await MyBEP20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseEther("100"));

    await MyBEP20Token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther("50"));
    const addr2Balance = await MyBEP20Token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.utils.parseEther("50"));
  });

  it("送信者に十分なトークンがない場合は失敗する必要があります。", async function () {
    const initialOwnerBalance = await MyBEP20Token.balanceOf(owner.address);
    await expect(
      MyBEP20Token.connect(addr1).transfer(owner.address, ethers.utils.parseEther("1"))
    ).to.be.revertedWith("不十分なバランス");

    expect(await MyBEP20Token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
  });

  it("手当を正しく更新する必要があります。", async function () {
    await MyBEP20Token.approve(addr1.address, ethers.utils.parseEther("100"));
    expect(await MyBEP20Token.allowance(owner.address, addr1.address)).to.equal(
      ethers.utils.parseEther("100")
    );

    await MyBEP20Token.connect(owner).increaseAllowance(addr1.address, ethers.utils.parseEther("50"));
    expect(await MyBEP20Token.allowance(owner.address, addr1.address)).to.equal(
      ethers.utils.parseEther("150")
    );

    await MyBEP20Token.connect(owner).decreaseAllowance(addr1.address, ethers.utils.parseEther("100"));
    expect(await MyBEP20Token.allowance(owner.address, addr1.address)).to.equal(
      ethers.utils.parseEther("50")
    );
  });

  it("トークンを正しく焼却する必要があります。", async function () {
    await MyBEP20Token.burn(ethers.utils.parseEther("100"));
    const ownerBalance = await MyBEP20Token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther("900"));

    const totalSupply = await MyBEP20Token.totalSupply();
    expect(totalSupply).to.equal(ethers.utils.parseEther("900"));
  });

  it("トークンを正しく鋳造する", async function () {
    await MyBEP20Token.transferOwnership(addr1.address);
    await expect(MyBEP20Token.connect(addr1).mint(addr1.address, ethers.utils.parseEther("1000")))
      .to.emit(MyBEP20Token, "Mint")
      .withArgs(addr1.address, ethers.utils.parseEther("1000"));

    const addr1Balance = await MyBEP20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseEther("1000"));
  });
});
