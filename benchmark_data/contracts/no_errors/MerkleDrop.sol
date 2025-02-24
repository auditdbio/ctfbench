// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAirdrop is Ownable {
    using SafeERC20 for IERC20;

    // Корневой хеш дерева
    bytes32 public merkleRoot;
    // Токен, который будет распределяться
    IERC20 public token;

    // Сохранение использованных листов, чтобы избежать повторного использования
    mapping(bytes32 => bool) public paid;

    // Событие при успешном начислении токенов
    event Claimed(address indexed receiver, uint256 amount, bytes32 leafHash);

    /// @notice Инициализация контракта с адресом токена и корневым хешем
    constructor(IERC20 _token, bytes32 _merkleRoot) {
        token = _token;
        merkleRoot = _merkleRoot;
    }

    /// @notice Функция для обновления корневого хеша (только для администратора)
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    /// @notice Функция для получения токенов по меркл-пруфу
    /// @param nonce уникальное число для данного листа (предотвращает повторное использование)
    /// @param receiver адрес, на который будут переведены токены
    /// @param amount количество токенов для перевода
    /// @param proof массив доказательств, подтверждающих принадлежность листа к дереву
    function claim(
        uint256 nonce,
        address receiver,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        // Формируем хеш листа. Обратите внимание на способ кодирования - он должен совпадать с тем, 
        // который использовался при генерации дерева (например, abi.encodePacked).
        bytes32 leaf = keccak256(abi.encodePacked(nonce, receiver, amount));
        
        // Проверяем, что данный лист еще не был использован
        require(!paid[leaf], "Airdrop already claimed");

        // Проверяем, что лист принадлежит меркл дереву с заданным корневым хешем
        require(verifyProof(proof, merkleRoot, leaf), "Invalid proof");

        // Отмечаем лист как использованный
        paid[leaf] = true;

        // Переводим токены с использованием безопасного метода
        token.safeTransfer(receiver, amount);

        emit Claimed(receiver, amount, leaf);
    }

    /// @notice Внутренняя функция для проверки меркл-пруфа
    /// @param proof массив доказательств
    /// @param root корневой хеш дерева
    /// @param leaf хеш проверяемого листа
    /// @return true, если доказательство верно, иначе false
    function verifyProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        // Проходим по всем элементам пруфа и последовательно вычисляем хеш
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        // Проверяем, что итоговый хеш совпадает с корневым
        return computedHash == root;
    }
}