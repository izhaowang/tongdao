// 初始化ECharts实例
        const chartDom = document.getElementById('chart-scatter');
        const myChart = echarts.init(chartDom);
        
        // 生成650个随机散点数据
        const dataCount = 300;
        const data = [];
        for (let i = 0; i < dataCount; i++) {
            data.push([
                Math.random() * 100,
                Math.random() * 100
            ]);
        }
        
        // 存储所有框框信息
        let rectangles = [];
        let rectangleIdCounter = 0;
        
        // 获取DOM元素（支持两种id：老版 `maxRectangles` 或 新版 `scatter-max-select`）
        const maxRectanglesInput = document.getElementById('maxRectangles') || document.getElementById('scatter-max-select');
        const clearAllBtn = document.getElementById('clearAllBtn');
        const statusBar = document.getElementById('statusBar');
        const rectanglesCount = document.getElementById('rectanglesCount');
        const currentMaxRectangles = document.getElementById('currentMaxRectangles');
        const coordinateInfo = document.getElementById('coordinateInfo');
        
        // 更新界面显示
        function updateDisplay() {
            const maxRectangles = parseInt(maxRectanglesInput.value) || 5;
            // rectanglesCount.textContent = `当前框框数量：${rectangles.length}`;

            if (currentMaxRectangles) currentMaxRectangles.textContent = maxRectangles;

            if (statusBar) {
                if (rectangles.length >= maxRectangles) {
                    statusBar.textContent = `状态：已达到最大框框数量(${maxRectangles})，添加新框框将移除最早的框框`;
                } else {
                    statusBar.textContent = `状态：还可以添加 ${maxRectangles - rectangles.length} 个框框`;
                }
            }

            // 更新图表
            updateChart();
            // 更新坐标显示
            refreshCoordinateInfo();
        }

        // 刷新 coordinateInfo，显示所有被框住的点坐标（合并所有矩形的点）
        function refreshCoordinateInfo() {
            if (!coordinateInfo) return;

            console.log('正在刷新坐标显示...', rectangles);
            // 合并所有矩形中的点
            const lastPointArr = rectangles[rectangles.length - 1]?.points || [];

            if (lastPointArr.length === 0) {
                coordinateInfo.textContent = '';
                return;
            }

            // 格式化输出，限制长度避免太长
            const formatted = lastPointArr.map(p => `[${p[0].toFixed(2)}, ${p[1].toFixed(2)}]`);
            const joined = formatted.join('; ');
            coordinateInfo.textContent = `当前选中点(${lastPointArr.length}): ` + (joined.length > 800 ? joined.slice(0, 800) + '...': joined);
        }
        
        // 清除所有框框
        function clearAllRectangles() {
            rectangles = [];
            updateDisplay();
            console.log('已清除所有框框');
        }
        
        // 检查点是否在矩形内
        function isPointInRect(point, rect) {
            const x = point[0];
            const y = point[1];
            const rectX = rect.x;
            const rectY = rect.y;
            const rectWidth = rect.width;
            const rectHeight = rect.height;
            
            return x >= rectX && 
                   x <= rectX + rectWidth && 
                   y >= rectY && 
                   y <= rectY + rectHeight;
        }
        
        // 生成随机颜色
        function generateRandomColor() {
            const colors = [
                '#87CEEB', '#98FB98', '#FFB6C1', '#DDA0DD', '#FFD700',
                '#F0E68C', '#90EE90', '#AFEEEE', '#D8BFD8', '#FFA07A'
            ];
            return colors[rectangleIdCounter % colors.length];
        }
        
        // 添加新的框框
        function addRectangle(x, y, width, height) {
            // 确保坐标在图表区域内 (0-100)
            x = Math.max(0, Math.min(x, 100));
            y = Math.max(0, Math.min(y, 100));
            
            // 确保宽度和高度在合理范围内
            width = Math.max(0.1, Math.min(width, 100 - x));
            height = Math.max(0.1, Math.min(height, 100 - y));
            
            // 生成矩形框信息
            const rectId = ++rectangleIdCounter;
            
            // 找出框内的所有点
            const pointsInRect = data.filter(point => isPointInRect(point, {
                x: x,
                y: y,
                width: width,
                height: height
            }));
            
            // 在控制台打印选中点的坐标
            console.log(`矩形框 ${rectId} 选中的点坐标：`, pointsInRect);
            console.log(`矩形框 ${rectId} 的位置：`, `x=${x.toFixed(2)}, y=${y.toFixed(2)}, width=${width.toFixed(2)}, height=${height.toFixed(2)}`);
            
            // 创建矩形框信息
            const rectInfo = {
                id: rectId,
                x: x,
                y: y,
                width: width,
                height: height,
                color: generateRandomColor(),
                points: pointsInRect,
                timestamp: Date.now()
            };
            
            // 添加到队列中
            rectangles.push(rectInfo);
            
            // 获取最大框框数量
            const maxRectangles = parseInt(maxRectanglesInput.value) || 5;
            
            // 如果超过最大数量，移除第一个框框（队列特性）
            if (rectangles.length > maxRectangles) {
                const removedRect = rectangles.shift(); // 移除第一个
                console.log(`已超出最大框框数量(${maxRectangles})，移除最早的框框: 框 ${removedRect.id}`);
            }
            
            // 更新显示
            updateDisplay();
        }
        
        // 更新图表
        function updateChart() {
            // 创建graphic元素数组
            const graphicElements = [];
            // 将每个矩形的数据坐标转换为像素坐标，以便 graphic 在像素空间正确绘制
            rectangles.forEach((rect) => {
                // 创建半透明的填充颜色
                const fillColor = rect.color.replace(')', ', 0.2)').replace('rgb', 'rgba');

                try {
                    // 左上角像素坐标：data (rect.x, rect.y + rect.height) 对应图像上方
                    const topLeft = myChart.convertToPixel({ seriesIndex: 0 }, [rect.x, rect.y + rect.height]);
                    // 右上像素（用于计算宽度）
                    const topRight = myChart.convertToPixel({ seriesIndex: 0 }, [rect.x + rect.width, rect.y + rect.height]);
                    // 左下像素（用于计算高度）
                    const bottomLeft = myChart.convertToPixel({ seriesIndex: 0 }, [rect.x, rect.y]);

                    const pxX = topLeft[0];
                    const pxY = topLeft[1];
                    const pxWidth = topRight[0] - topLeft[0];
                    const pxHeight = bottomLeft[1] - topLeft[1];

                    graphicElements.push({
                        type: 'rect',
                        shape: {
                            x: pxX,
                            y: pxY,
                            width: pxWidth,
                            height: pxHeight
                        },
                        style: {
                            fill: fillColor,
                            stroke: rect.color,
                            lineWidth: 2
                        },
                        textContent: {
                            style: {
                                // text: `框 ${rect.id}`,
                                fill: rect.color,
                                fontSize: 12,
                                fontWeight: 'bold'
                            }
                        },
                        textConfig: {
                            position: 'insideTopLeft',
                            offset: [5, 5]
                        },
                        silent: true
                    });
                } catch (e) {
                    // 如果转换失败，忽略该矩形的像素绘制（避免抛错）
                    console.warn('矩形坐标转换失败，跳过绘制：', e);
                }
            });
            
            // 如果有临时矩形，也加上
            if (currentRect) {
                try {
                    const topLeft = myChart.convertToPixel({ seriesIndex: 0 }, [currentRect.x, currentRect.y + currentRect.height]);
                    const topRight = myChart.convertToPixel({ seriesIndex: 0 }, [currentRect.x + currentRect.width, currentRect.y + currentRect.height]);
                    const bottomLeft = myChart.convertToPixel({ seriesIndex: 0 }, [currentRect.x, currentRect.y]);
                    const pxX = topLeft[0];
                    const pxY = topLeft[1];
                    const pxWidth = topRight[0] - topLeft[0];
                    const pxHeight = bottomLeft[1] - topLeft[1];

                    const tempRect = {
                        type: 'rect',
                        shape: {
                            x: pxX,
                            y: pxY,
                            width: pxWidth,
                            height: pxHeight
                        },
                        style: {
                            fill: 'rgba(135, 206, 235, 0.3)',
                            stroke: '#87CEEB',
                            lineWidth: 1
                        }
                    };
                    graphicElements.push(tempRect);
                } catch (e) {
                    // ignore
                }
            }
            
            // 更新图表选项
            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        return `坐标: (${params.value[0].toFixed(2)}, ${params.value[1].toFixed(2)})`;
                    }
                },
                xAxis: {
                    name: 'X轴',
                    type: 'value',
                    scale: true,
                    min: 0,
                    max: 100
                },
                yAxis: {
                    name: 'Y轴',
                    type: 'value',
                    scale: true,
                    min: 0,
                    max: 100
                },
                series: [{
                    name: '散点',
                    type: 'scatter',
                    data: data,
                    symbolSize: 8,
                    itemStyle: {
                        color: '#5470c6'
                    }
                }],
                graphic: graphicElements
            };
            
            myChart.setOption(option, true);
        }
        
        // 配置图表初始选项
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function(params) {
                    return `坐标: (${params.value[0].toFixed(2)}, ${params.value[1].toFixed(2)})`;
                }
            },
            xAxis: {
                name: 'X轴',
                type: 'value',
                scale: true,
                min: 0,
                max: 100
            },
            yAxis: {
                name: 'Y轴',
                type: 'value',
                scale: true,
                min: 0,
                max: 100
            },
            series: [{
                name: '散点',
                type: 'scatter',
                data: data,
                symbolSize: 8,
                itemStyle: {
                    color: '#5470c6'
                }
            }],
            graphic: []
        };
        
        myChart.setOption(option);
        
        // 手动实现框选功能
        let isDrawing = false;
        let startX = 0;
        let startY = 0;
        let currentRect = null;
        
        // 获取鼠标在图表数据坐标系中的位置
        function getChartCoordinate(clientX, clientY) {
            const rect = chartDom.getBoundingClientRect();
            const pixelX = clientX - rect.left;
            const pixelY = clientY - rect.top;
            
            // 使用ECharts的convertFromPixel方法将像素坐标转换为数据坐标
            // 注意：这里使用'grid'坐标系
            try {
                const point = myChart.convertFromPixel({ seriesIndex: 0 }, [pixelX, pixelY]);
                return point;
            } catch (e) {
                // 如果转换失败，返回null
                console.warn('坐标转换失败:', e);
                return null;
            }
        }
        
        // 监听鼠标按下事件（开始框选）
        chartDom.addEventListener('mousedown', function(e) {
            // 左键开始框选
            if (e.button === 0) {
                const point = getChartCoordinate(e.clientX, e.clientY);
                if (point) {
                    isDrawing = true;
                    startX = point[0];
                    startY = point[1];
                    
                    // 创建临时矩形
                    currentRect = {
                        x: startX,
                        y: startY,
                        width: 0,
                        height: 0
                    };
                    
                    // 更新坐标显示
                    // coordinateInfo.textContent = `开始坐标: (${startX.toFixed(2)}, ${startY.toFixed(2)})`;
                    
                    // 阻止默认行为，避免选中文本
                    e.preventDefault();
                }
            }
            // 右键清除所有框框
            else if (e.button === 2) {
                e.preventDefault();
                clearAllRectangles();
            }
        });
        
        // 监听鼠标移动事件（绘制框选）
        chartDom.addEventListener('mousemove', function(e) {
            // 更新鼠标位置显示
            const point = getChartCoordinate(e.clientX, e.clientY);
            // if (point) {
            //     if (coordinateInfo) coordinateInfo.textContent = `当前坐标: (${point[0].toFixed(2)}, ${point[1].toFixed(2)})`;
            // }
            
            if (!isDrawing) return;
            
            const point2 = getChartCoordinate(e.clientX, e.clientY);
            if (point2) {
                // 计算矩形的宽度和高度
                let rectX = startX;
                let rectY = startY;
                let rectWidth = point2[0] - startX;
                let rectHeight = point2[1] - startY;
                
                // 确保宽度和高度为正数，并调整起始点
                if (rectWidth < 0) {
                    rectX = point2[0];
                    rectWidth = -rectWidth;
                }
                if (rectHeight < 0) {
                    rectY = point2[1];
                    rectHeight = -rectHeight;
                }
                
                // 更新临时矩形
                currentRect = {
                    x: rectX,
                    y: rectY,
                    width: rectWidth,
                    height: rectHeight
                };
                
                // 更新图表与坐标显示（显示当前临时矩形包含的点）
                if (coordinateInfo) {
                    const previewPoints = data.filter(pt => isPointInRect(pt, { x: rectX, y: rectY, width: rectWidth, height: rectHeight }));
                    if (previewPoints.length === 0) {
                        coordinateInfo.textContent = `绘制中: [${rectX.toFixed(2)}, ${rectY.toFixed(2)}]  ${rectWidth.toFixed(2)} x ${rectHeight.toFixed(2)} — 0 点`;
                    } else {
                        const pf = previewPoints.map(p => `[${p[0].toFixed(2)}, ${p[1].toFixed(2)}]`);
                        const joined = pf.join('; ');
                        coordinateInfo.textContent = `绘制中 点(${previewPoints.length}): ` + (joined.length > 800 ? joined.slice(0,800) + '...' : joined);
                    }
                }
                updateChart();
            }
        });
        
        // 监听鼠标释放事件（完成框选）
        chartDom.addEventListener('mouseup', function(e) {
            if (!isDrawing || e.button !== 0) return;
            
            isDrawing = false;
            
            // 只有当矩形有实际大小时才添加
            if (currentRect && currentRect.width > 0.1 && currentRect.height > 0.1) {
                addRectangle(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
            }
            
            // 清除临时矩形
            currentRect = null;

            // 更新图表
            updateChart();
        });
        
        // 监听清除所有按钮点击事件（如果存在）
        if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllRectangles);
        
        // 监听最大框选数量输入变化
        maxRectanglesInput.addEventListener('change', function() {
            const maxRectangles = parseInt(this.value) || 5;
            
            // 如果当前框框数量超过新的最大数量，移除多余的框
            if (rectangles.length > maxRectangles) {
                const removeCount = rectangles.length - maxRectangles;
                for (let i = 0; i < removeCount; i++) {
                    rectangles.shift();
                }
                updateDisplay();
            }
            
            updateDisplay();
        });
        
        // 阻止默认的右键菜单
        chartDom.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
        
        // 初始显示
        updateDisplay();
        
        // 窗口大小变化时重置图表大小
        window.addEventListener('resize', function() {
            myChart.resize();
        });
        
        // 打印初始化信息
        console.log('散点图已初始化，包含650个散点');
        console.log('操作方法：');
        console.log('1. 在图表中拖动鼠标框选散点');
        console.log('2. 右键点击图表清除所有框框');
        console.log('3. 超出最大框框数量时，最早的选择框会被自动移除');
