-- Constraints DDL para La Cazuela Chapina

-- Constraints para USUARIOS
ALTER TABLE Usuarios
ADD CONSTRAINT chk_rol CHECK (Rol IN ('cliente', 'admin'));

-- Constraints para PRODUCTOS
ALTER TABLE Productos
ADD CONSTRAINT chk_tipo_producto CHECK (Tipo_producto IN ('tamal', 'bebida', 'combo'));

ALTER TABLE Productos
ADD CONSTRAINT chk_personalizable CHECK (Personalizable IN ('S', 'N'));

ALTER TABLE Productos
ADD CONSTRAINT chk_disponible CHECK (Disponible IN ('S', 'N'));

-- Constraints para INVENTARIO (Inv)
ALTER TABLE Inv
ADD CONSTRAINT chk_categoria CHECK (Categoria IN ('materias_primas', 'empaques', 'combustible'));

-- Constraints para MOVIMIENTOS_INVENTARIO (Mov_Inventario)
ALTER TABLE Mov_Inventario
ADD CONSTRAINT chk_tipo_movimiento CHECK (Tipo IN ('entrada', 'salida', 'merma'));

-- Constraints para PEDIDOS
ALTER TABLE Pedidos
ADD CONSTRAINT chk_estado_pedido CHECK (Estado IN ('pendiente', 'preparando', 'entregado', 'cancelado'));

-- Constraints para RELACIÓN PRODUCTO - INGREDIENTE (Prod_Ingred)
ALTER TABLE Prod_Ingred
ADD CONSTRAINT Prod_Ingred_Cant_CHK CHECK (Cantidad > 0);

ALTER TABLE Prod_Ingred
ADD CONSTRAINT Prod_Ingred_UQ UNIQUE (Productos_ID_Producto, Inv_ID_Inv);

-- -----------------------------------------------------------------
-- Secuencias y triggers para generar IDs correlativos
-- -----------------------------------------------------------------

-- Secuencias
CREATE SEQUENCE seq_inv START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_mov_inventario START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_pedidos START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_productos START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_productos_pedido START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_prod_ingred START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_usuarios START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE seq_unidad START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- Triggers BEFORE INSERT para asignar el siguiente valor de la secuencia
CREATE OR REPLACE TRIGGER trg_inv_bi
BEFORE INSERT ON Inv
FOR EACH ROW
BEGIN
	IF :NEW.ID_Inv IS NULL THEN
		SELECT seq_inv.NEXTVAL INTO :NEW.ID_Inv FROM dual;
	END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_mov_inventario_bi
BEFORE INSERT ON Mov_Inventario
FOR EACH ROW
BEGIN
	IF :NEW.ID_Mov IS NULL THEN
		SELECT seq_mov_inventario.NEXTVAL INTO :NEW.ID_Mov FROM dual;
	END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_pedidos_bi
BEFORE INSERT ON Pedidos
FOR EACH ROW
BEGIN
	IF :NEW.ID_Pedido IS NULL THEN
		SELECT seq_pedidos.NEXTVAL INTO :NEW.ID_Pedido FROM dual;
	END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_productos_bi
BEFORE INSERT ON Productos
FOR EACH ROW
BEGIN
	IF :NEW.ID_Producto IS NULL THEN
		SELECT seq_productos.NEXTVAL INTO :NEW.ID_Producto FROM dual;
	END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_productos_pedido_bi
BEFORE INSERT ON Productos_Pedido
FOR EACH ROW
BEGIN
	IF :NEW.ID_producto_pedido IS NULL THEN
		SELECT seq_productos_pedido.NEXTVAL INTO :NEW.ID_producto_pedido FROM dual;
	END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_prod_ingred_bi
BEFORE INSERT ON Prod_Ingred
FOR EACH ROW
BEGIN
    IF :NEW.ID_PI IS NULL THEN
        SELECT seq_prod_ingred.NEXTVAL INTO :NEW.ID_PI FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_usuarios_bi
BEFORE INSERT ON Usuarios
FOR EACH ROW
BEGIN
	IF :NEW.ID_Usuario IS NULL THEN
		SELECT seq_usuarios.NEXTVAL INTO :NEW.ID_Usuario FROM dual;
	END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_unidad_bi
BEFORE INSERT ON Unidad
FOR EACH ROW
BEGIN
	IF :NEW.ID_Unidad IS NULL THEN
		SELECT seq_unidad.NEXTVAL INTO :NEW.ID_Unidad FROM dual;
	END IF;
END;
/