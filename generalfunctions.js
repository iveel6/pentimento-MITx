function getDistance(v1, v2){
    var x1 = v1.x,
        x2 = v2.x,
        y1 = v1.y,
        y2 = v2.y;
    return Math.sqrt( (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
}

function matrixMultiply(mtrx1, mtrx2) {
    return {
        m11: (mtrx1.m11*mtrx2.m11 + mtrx1.m12*mtrx2.m21),
        m12: (mtrx1.m11*mtrx2.m12 + mtrx1.m12*mtrx2.m22),
        tx: (mtrx1.m11*mtrx2.tx + mtrx1.m12*mtrx2.ty + mtrx1.tx),
        m21: (mtrx1.m21*mtrx2.m11 + mtrx1.m22*mtrx2.m21),
        m22: (mtrx1.m21*mtrx2.m12 + mtrx1.m22*mtrx2.m22),
        ty: (mtrx1.m21*mtrx2.tx + mtrx1.m22*mtrx2.ty + mtrx1.ty)
    }
}