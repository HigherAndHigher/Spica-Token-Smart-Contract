import {
  time,
  loadFixture,
} from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';

describe('MyBEP20Token', function () {
  let owner: any;
  let addr1: any;
  let addr2: any;
  let MyBEP20Token: any;

  beforeEach('Deploy', async function deployFixture() {
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    const MyBEP20TokenFactory = await hre.ethers.getContractFactory('MyBEP20Token');
    MyBEP20Token = await MyBEP20TokenFactory.deploy(
      'MyToken',
      'MTK',
      18,
      ethers.utils.parseEther('1000') // Initial supply of 1000 tokens
    );
    await MyBEP20Token.deployed();
  });

  it('Deploy Test', async function () {
    console.log('MyBEP20Token deployed to:', await MyBEP20Token.getAddress());
  });

  it('名前、記号、小数点以下が正確でなければなりません。', async function () {
    expect(await MyBEP20Token.name()).to.equal('MyToken');
    expect(await MyBEP20Token.symbol()).to.equal('MTK');
    expect(await MyBEP20Token.decimals()).to.equal(18);
  });

  it('所有者に初期供給を割り当てる必要があります。', async function () {
    const ownerBalance = await MyBEP20Token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther('1000'));
  });

  it('アカウント間でトークンを転送する必要がある場合', async function () {
    await MyBEP20Token.transfer(addr1.address, ethers.utils.parseEther('100'));
    const addr1Balance = await MyBEP20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseEther('100'));

    await MyBEP20Token.connect(addr1).transfer(addr2.address, ethers.utils.parseEther('50'));
    const addr2Balance = await MyBEP20Token.balanceOf(addr2.address);
    expect(addr2Balance).to.equal(ethers.utils.parseEther('50'));
  });

  it('送信者に十分なトークンがない場合は失敗する必要があります。', async function () {
    const initialOwnerBalance = await MyBEP20Token.balanceOf(owner.address);
    await expect(
      MyBEP20Token.connect(addr1).transfer(owner.address, ethers.utils.parseEther('1'))
    ).to.be.revertedWith('不十分なバランス');

    expect(await MyBEP20Token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
  });

  it('手当を正しく更新する必要があります。', async function () {
    await MyBEP20Token.approve(addr1.address, ethers.utils.parseEther('100'));
    expect(await MyBEP20Token.allowance(owner.address, addr1.address)).to.equal(
      ethers.utils.parseEther('100')
    );

    await MyBEP20Token.connect(owner).increaseAllowance(addr1.address, ethers.utils.parseEther('50'));
    expect(await MyBEP20Token.allowance(owner.address, addr1.address)).to.equal(
      ethers.utils.parseEther('150')
    );

    await MyBEP20Token.connect(owner).decreaseAllowance(addr1.address, ethers.utils.parseEther('100'));
    expect(await MyBEP20Token.allowance(owner.address, addr1.address)).to.equal(
      ethers.utils.parseEther('50')
    );
  });

  it('トークンを正しく焼却する必要があります。', async function () {
    await MyBEP20Token.burn(ethers.utils.parseEther('100'));
    const ownerBalance = await MyBEP20Token.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.utils.parseEther('900'));

    const totalSupply = await MyBEP20Token.totalSupply();
    expect(totalSupply).to.equal(ethers.utils.parseEther('900'));
  });

  it('トークンを正しく鋳造する', async function () {
    await MyBEP20Token.transferOwnership(addr1.address);
    await expect(MyBEP20Token.connect(addr1).mint(addr1.address, ethers.utils.parseEther('1000')))
      .to.emit(MyBEP20Token, 'Mint')
      .withArgs(addr1.address, ethers.utils.parseEther('1000'));

    const addr1Balance = await MyBEP20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.utils.parseEther('1000'));
  });

  it('アカウントの正確な残高を転送する必要があります。', async function () {
    await MyBEP20Token.transfer(addr1.address, ethers.utils.parseEther('100'));
    await MyBEP20Token.connect(addr1).transfer(owner.address, ethers.utils.parseEther('100'));
    const addr1Balance = await MyBEP20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(0);
  });

  it('ゼロの手当と転送を正しく処理する必要があります。', async function () {
    await MyBEP20Token.approve(addr1.address, 0);
    expect(await MyBEP20Token.allowance(owner.address, addr1.address)).to.equal(0);

    await expect(MyBEP20Token.transfer(addr1.address, 0)).to.not.be.reverted;
    const addr1Balance = await MyBEP20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(0);
  });

  it('非常に大きな数値を処理できる必要があります。', async function () {
    const largeAmount = ethers.constants.MaxUint256;
    await MyBEP20Token.transfer(addr1.address, largeAmount);
    const addr1Balance = await MyBEP20Token.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(largeAmount);
  });
});
